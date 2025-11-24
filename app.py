from flask import Flask, jsonify, request, render_template
import boto3
from botocore.client import Config
from boto3.dynamodb.conditions import Key, Attr
import os

app = Flask(__name__)

# --- Configuração ---
S3_UPLOAD_BUCKET = "upload-projetcloud"
DYNAMO_TABLE_NAME = "imagens_base64_projeto"
# ADICIONADO: Definir a região explicitamente para evitar o erro NoRegionError
AWS_REGION = "us-east-2"

# Inicializa os clientes com a região definida
s3_client = boto3.client('s3', config=Config(signature_version='s3v4'), region_name=AWS_REGION)
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(DYNAMO_TABLE_NAME)

# --- Endpoint de Saúde ---
@app.route('/health')
def health_check():
    return jsonify({"status": "ok"}), 200

# --- Endpoint de Upload ---
@app.route('/api/generate-upload-url', methods=['POST'])
def generate_upload_url():
    data = request.get_json()
    filename = data.get('filename')
    content_type = data.get('contentType')
    
    if not filename or not content_type:
        return jsonify({"error": "filename e contentType são obrigatórios"}), 400
        
    try:
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket':S3_UPLOAD_BUCKET,
                'Key': filename,
                'ContentType': content_type
            },
            ExpiresIn=3600
        )
        return jsonify({"uploadUrl": presigned_url, "key": filename})
    except Exception as e:
        print(f"Erro ao gerar URL: {e}")
        return jsonify({"error": str(e)}), 500

# --- Endpoint de Listagem ---
@app.route('/api/images', methods=['GET'])
def list_images():
    try:
        response = table.scan(
            FilterExpression=Attr('chunkId').eq('meta')
        )
        items = response.get('Items', [])
        for item in items:
            item['filename'] = item.get('imageId', 'NomeDesconhecido') 
        return jsonify(items)
    except Exception as e:
        print(f"Erro ao listar imagens: {e}")
        return jsonify({"error": str(e)}), 500

# --- Endpoint de Visualização ---
@app.route('/api/images/<string:imageId>', methods=['GET'])
def get_image_base64(imageId):
    try:
        response = table.query(
            KeyConditionExpression=Key('imageId').eq(imageId)
        )
        
        items = response.get('Items', [])
        if not items:
            return jsonify({"error": "Imagem não encontrada"}), 404
            
        meta_item = None
        chunks = {}
        
        for item in items:
            if item['chunkId'] == 'meta':
                meta_item = item
            elif 'chunk_' in item['chunkId']:
                chunks[item['chunkId']] = item['data']
        
        if not meta_item:
            return jsonify({"error": "Metadados da imagem não encontrados"}), 500
            
        base64_string = ""
        for i in range(int(meta_item['totalChunks'])):
            chunk_key = f"chunk_{i:04d}"
            base64_string += chunks.get(chunk_key, "")
            
        return jsonify({
            "imageId": imageId,
            "filename": imageId,
            "contentType": meta_item.get('contentType'),
            "base64data": base64_string,
            "size": meta_item.get('sizeBytes'),
            "createdAt": meta_item.get('createdAt', '2025-01-01'),
            "tags": meta_item.get('tags', [])
        })
            
    except Exception as e:
        print(f"Erro ao buscar imagem: {e}")
        return jsonify({"error": str(e)}), 500

# --- Endpoint do Front-End ---
@app.route('/')
def serve_client_html():
    return render_template('clientes.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)