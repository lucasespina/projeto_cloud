# CloudImage Solutions - Projeto Cloud Computing

## 📋 Descrição do Projeto

Sistema completo de gerenciamento de imagens na nuvem, desenvolvido como projeto acadêmico do curso de Cloud Computing do Insper.

### Componentes Principais

1. **Site Estático Institucional** - Hospedado em bucket S3
   - História da empresa
   - Informações sobre a equipe desenvolvedora
   - Acesso à área de clientes

2. **Área de Clientes** - Hospedada em EC2 com ALB e ASG
   - Upload de imagens
   - Listagem de imagens armazenadas
   - Visualização de conversão Base64

3. **Documento de Disaster Recovery (DR)**
   - Cenários de falha
   - Mapeamento de serviços equivalentes
   - Procedimentos e custos de migração

## 🏗️ Arquitetura AWS

### Serviços Utilizados

- **Amazon S3**: Armazenamento do site estático e imagens
- **AWS Lambda**: Processamento automático e conversão Base64
- **Amazon DynamoDB**: Armazenamento de metadados e dados Base64
- **Amazon EC2**: Aplicação da área de clientes
- **Application Load Balancer (ALB)**: Distribuição de tráfego HTTPS
- **Auto Scaling Group (ASG)**: Escalabilidade automática
- **VPC e Security Groups**: Segurança e isolamento de rede

### Fluxo do Sistema

1. Cliente acessa site institucional (S3)
2. Navegação para Área de Clientes (EC2 via ALB)
3. Solicitação de URL pré-assinada para upload
4. Upload direto para S3
5. Evento ObjectCreated aciona Lambda
6. Lambda processa e armazena no DynamoDB
7. Cliente consulta imagens via aplicação EC2
8. Visualização de string Base64

## 📁 Estrutura do Projeto

```
projeto_cloud/
├── static-site/          # Site estático para S3
│   ├── index.html       # Página principal
│   ├── sobre.html       # História da empresa
│   ├── equipe.html      # Informações da equipe
│   └── clientes.html    # Acesso à área de clientes
├── client-area/         # Aplicação EC2 (a ser criada)
├── lambda/              # Funções Lambda (a ser criada)
└── terraform/           # IaC para deploy (a ser criada)
```

## 🚀 Tecnologias

- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **Backend**: Python, Flask, Boto3
- **Cloud**: AWS (S3, Lambda, EC2, DynamoDB, ALB, ASG)
- **IaC**: Terraform (planejado)

## 👥 Equipe de Desenvolvimento

- **Lucas Espina** - Desenvolvedor Full-Stack
  - Responsável pela arquitetura AWS, funções Lambda, integração com DynamoDB e desenvolvimento da área de clientes

- **Diogo Diniz** - Desenvolvedor Full-Stack
  - Responsável pelo site estático, interface da área de clientes, integração com serviços AWS e documentação

## 📝 Status do Projeto

- [x] Site estático criado
- [ ] Infraestrutura AWS configurada
- [ ] Aplicação de clientes desenvolvida
- [ ] Funções Lambda implementadas
- [ ] Documento DR elaborado
- [ ] Testes de alta disponibilidade

## 📄 Licença

Projeto acadêmico - Insper 2025

---

© 2025 CloudImage Solutions - Projeto Cloud Computing

