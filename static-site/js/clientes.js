// Script específico para a página de clientes

// Configuração da API - URL do ALB da AWS
const API_BASE_URL = 'http://alb-api-projeto-1577545495.us-east-2.elb.amazonaws.com/api';

// Gerenciamento de tabs
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeUploadForm();
    initializeFileInput();
    initializeListSection();
    initializeViewSection();
});

// Inicializar sistema de tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('id').replace('tab-', 'section-');

            // Remover active de todos os botões
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
                btn.classList.add('text-gray-500');
            });

            // Adicionar active ao botão clicado
            this.classList.add('active', 'text-blue-600', 'border-blue-600');
            this.classList.remove('text-gray-500');

            // Esconder todos os conteúdos
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });

            // Mostrar conteúdo correspondente
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }

            // Carregar dados quando necessário
            if (targetTab === 'section-list') {
                loadImagesList();
            } else if (targetTab === 'section-view') {
                loadImagesForView();
            }
        });
    });
}

// Inicializar formulário de upload
function initializeUploadForm() {
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleImageUpload();
        });
    }
}

// Inicializar input de arquivo
function initializeFileInput() {
    const fileInput = document.getElementById('file-upload');
    const fileName = document.getElementById('file-name');
    const dropZone = fileInput?.closest('.border-dashed');

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                fileName.textContent = `Arquivo selecionado: ${file.name} (${formatFileSize(file.size)})`;
                fileName.classList.remove('hidden');
            }
        });
    }

    // Drag and drop
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && fileInput) {
                fileInput.files = files;
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
            }
        });
    }
}

// Manipular upload de imagem
async function handleImageUpload() {
    const fileInput = document.getElementById('file-upload');
    const tagsInput = document.getElementById('tags');
    const uploadFeedback = document.getElementById('upload-feedback');
    const uploadSuccess = document.getElementById('upload-success');
    const uploadError = document.getElementById('upload-error');
    const uploadSuccessMessage = document.getElementById('upload-success-message');
    const uploadErrorMessage = document.getElementById('upload-error-message');

    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        showError('Por favor, selecione uma imagem.');
        return;
    }

    const file = fileInput.files[0];
    const tags = tagsInput.value.trim();

    // Validar tamanho do arquivo (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('O arquivo é muito grande. Tamanho máximo: 10MB');
        return;
    }

    // Esconder feedbacks anteriores
    uploadFeedback?.classList.remove('hidden');
    uploadSuccess?.classList.add('hidden');
    uploadError?.classList.add('hidden');

    try {
        // Passo 1: Pedir a URL pré-assinada para nossa API
        const apiResponse = await fetch(`${API_BASE_URL}/generate-upload-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type
            })
        });

        const data = await apiResponse.json();
        if (!apiResponse.ok) {
            throw new Error(data.error || 'Erro ao gerar URL pré-assinada.');
        }

        // Passo 2: Fazer o upload do arquivo direto para o S3
        const s3Response = await fetch(data.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file
        });

        if (!s3Response.ok) {
            throw new Error('Erro ao fazer upload para o S3.');
        }

        // Mostrar sucesso
        if (uploadSuccess && uploadSuccessMessage) {
            uploadSuccessMessage.textContent = `Upload concluído! A imagem "${file.name}" está sendo processada.`;
            uploadSuccess.classList.remove('hidden');
        }

        // Limpar formulário
        fileInput.value = '';
        tagsInput.value = '';
        const fileName = document.getElementById('file-name');
        if (fileName) {
            fileName.classList.add('hidden');
        }

        // Aguarda um pouco o Lambda processar e atualiza a lista se estiver na aba de listagem
        setTimeout(() => {
            const listTab = document.getElementById('tab-list');
            if (listTab && listTab.classList.contains('active')) {
                loadImagesList();
            }
        }, 3000);

    } catch (error) {
        console.error('Erro no upload:', error);
        if (uploadError && uploadErrorMessage) {
            uploadErrorMessage.textContent = `Erro ao enviar imagem: ${error.message}`;
            uploadError.classList.remove('hidden');
        }
    }
}

// Carregar lista de imagens
async function loadImagesList() {
    const imagesList = document.getElementById('images-list');
    if (!imagesList) return;

    // Mostrar loading
    imagesList.innerHTML = '<div class="text-center py-12"><div class="spinner mx-auto"></div><p class="text-gray-500 mt-4">Carregando imagens...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/images`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar imagens');
        }

        const images = await response.json();
        
        if (!images || images.length === 0) {
            imagesList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p>Nenhuma imagem encontrada. Faça upload de uma imagem para começar.</p>
                </div>
            `;
            return;
        }

        renderImagesList(images);

    } catch (error) {
        console.error('Erro ao carregar imagens:', error);
        imagesList.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
                <p class="text-red-800">Erro ao carregar imagens: ${error.message}</p>
            </div>
        `;
    }
}

// Renderizar lista de imagens
function renderImagesList(images) {
    const imagesList = document.getElementById('images-list');
    if (!imagesList || !images || images.length === 0) {
        imagesList.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <p>Nenhuma imagem encontrada.</p>
            </div>
        `;
        return;
    }

    imagesList.innerHTML = images.map(image => {
        const imageId = image.imageId || image.id || '';
        const contentType = image.contentType || 'image/png';
        const fileName = image.filename || image.fileName || `Imagem ${imageId}`;
        const tags = image.tags || [];
        const createdAt = image.createdAt || image.created_at || new Date();
        const size = image.size || 0;

        return `
            <div class="image-card bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-lg transition">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800">${fileName}</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            ${tags.length > 0 ? tags.map(tag => `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1">${tag}</span>`).join('') : '<span class="text-gray-400 text-xs">Sem tags</span>'}
                        </p>
                        <p class="text-xs text-gray-500 mt-2">
                            ${formatFileSize(size)} • ${formatDate(createdAt)} • Tipo: ${contentType}
                        </p>
                    </div>
                    <button onclick="viewImageBase64('${imageId}')" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 ml-4">
                        Ver Base64
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Inicializar seção de listagem
function initializeListSection() {
    const refreshBtn = document.getElementById('refresh-list');
    const searchInput = document.getElementById('search-tags');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadImagesList);
    }

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            // Filtro simples de busca (pode ser melhorado no backend)
            const searchTerm = e.target.value.toLowerCase();
            const imageCards = document.querySelectorAll('.image-card');
            
            imageCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

// Inicializar seção de visualização
function initializeViewSection() {
    const selectImage = document.getElementById('select-image');
    const copyBtn = document.getElementById('copy-base64');

    if (selectImage) {
        selectImage.addEventListener('change', async function() {
            const imageId = this.value;
            if (imageId) {
                await loadImageBase64(imageId);
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const base64Text = document.getElementById('base64-text');
            if (base64Text && base64Text.value) {
                base64Text.select();
                document.execCommand('copy');
                
                // Feedback visual
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copiado!';
                copyBtn.classList.remove('bg-gray-600');
                copyBtn.classList.add('bg-green-600');
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('bg-green-600');
                    copyBtn.classList.add('bg-gray-600');
                }, 2000);
            }
        });
    }
}

// Carregar imagens para o select
async function loadImagesForView() {
    const selectImage = document.getElementById('select-image');
    if (!selectImage) return;

    try {
        const response = await fetch(`${API_BASE_URL}/images`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar imagens');
        }

        const images = await response.json();
        
        // Limpar opções existentes (exceto a primeira)
        selectImage.innerHTML = '<option value="">Selecione uma imagem...</option>';

        if (images && images.length > 0) {
            images.forEach(image => {
                const imageId = image.imageId || image.id || '';
                const fileName = image.filename || image.fileName || `Imagem ${imageId}`;
                const option = document.createElement('option');
                option.value = imageId;
                option.textContent = `${fileName} (${image.contentType || 'image/png'})`;
                selectImage.appendChild(option);
            });
        }

    } catch (error) {
        console.error('Erro ao carregar imagens para visualização:', error);
        selectImage.innerHTML = '<option value="">Erro ao carregar imagens</option>';
    }
}

// Carregar Base64 de uma imagem
async function loadImageBase64(imageId) {
    const base64Content = document.getElementById('base64-content');
    const base64Text = document.getElementById('base64-text');
    const base64Preview = document.getElementById('base64-preview');
    const metadataContent = document.getElementById('metadata-content');

    if (!base64Content || !base64Text || !imageId) return;

    // Mostrar loading
    base64Content.classList.remove('hidden');
    base64Text.value = 'Carregando Base64...';
    if (base64Preview) base64Preview.src = '';
    if (metadataContent) metadataContent.innerHTML = '<p class="text-gray-500">Carregando...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/images/${imageId}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erro ao buscar imagem');
        }

        const data = await response.json();
        
        // Mostrar a string Base64
        const base64Data = data.base64data || data.base64 || '';
        base64Text.value = base64Data;

        // Montar Data URI para exibir a imagem
        const contentType = data.contentType || 'image/png';
        if (base64Preview && base64Data) {
            const dataUri = `data:${contentType};base64,${base64Data}`;
            base64Preview.src = dataUri;
        }

        // Renderizar metadados
        if (metadataContent) {
            renderMetadata(data);
        }

    } catch (error) {
        console.error('Erro ao carregar Base64:', error);
        base64Text.value = `Erro ao carregar Base64: ${error.message}`;
        if (base64Preview) base64Preview.src = '';
        if (metadataContent) {
            metadataContent.innerHTML = `<p class="text-red-600">Erro: ${error.message}</p>`;
        }
    }
}

// Renderizar metadados
function renderMetadata(data) {
    const metadataContent = document.getElementById('metadata-content');
    if (!metadataContent) return;

    const contentType = data.contentType || 'N/A';
    const size = data.size || 0;
    const createdAt = data.createdAt || data.created_at || new Date();
    const tags = data.tags || [];
    const imageId = data.imageId || data.id || 'N/A';

    metadataContent.innerHTML = `
        <p><strong>ID:</strong> ${imageId}</p>
        <p><strong>Tipo:</strong> ${contentType}</p>
        <p><strong>Tamanho:</strong> ${formatFileSize(size)}</p>
        <p><strong>Data de Criação:</strong> ${formatDate(createdAt)}</p>
        <p><strong>Tags:</strong> ${tags.length > 0 ? tags.join(', ') : 'Nenhuma'}</p>
    `;
}

// Função para visualizar Base64 (chamada do botão na lista)
function viewImageBase64(imageId) {
    // Mudar para a tab de visualização
    const viewTab = document.getElementById('tab-view');
    if (viewTab) {
        viewTab.click();
    }

    // Aguardar um pouco para a tab carregar e então selecionar a imagem
    setTimeout(() => {
        const selectImage = document.getElementById('select-image');
        if (selectImage) {
            // Carregar lista se ainda não estiver carregada
            if (selectImage.options.length <= 1) {
                loadImagesForView().then(() => {
                    selectImage.value = imageId;
                    const event = new Event('change', { bubbles: true });
                    selectImage.dispatchEvent(event);
                });
            } else {
                selectImage.value = imageId;
                const event = new Event('change', { bubbles: true });
                selectImage.dispatchEvent(event);
            }
        }
    }, 100);
}

// Funções utilitárias
function showError(message) {
    const uploadError = document.getElementById('upload-error');
    const uploadErrorMessage = document.getElementById('upload-error-message');
    const uploadFeedback = document.getElementById('upload-feedback');

    if (uploadFeedback) uploadFeedback.classList.remove('hidden');
    if (uploadError) uploadError.classList.remove('hidden');
    if (uploadErrorMessage) uploadErrorMessage.textContent = message;
}
