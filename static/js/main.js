// Detecção de modo escuro
function setupDarkMode() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (event.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
}

// Variáveis globais para armazenar o estado atual da página
let currentPage = 1;
let currentSearchParams = {};
let currentResults = {};

// Função para realizar a busca
function performSearch(page = 1) {
    try {
        // Obter valores do formulário
        const searchTerm = document.getElementById('search').value.trim();
        const uf = document.getElementById('uf').value;
        const modalidade = document.getElementById('modalidade').value;
        const status = document.getElementById('status').value;
        
        if (!searchTerm) {
            alert('Por favor, digite um termo de busca.');
            return;
        }
        
        // Mostrar área de resultados e indicador de carregamento
        document.getElementById('resultsContainer').classList.remove('hidden');
        document.getElementById('loadingResults').classList.remove('hidden');
        
        // Esconder outros elementos que possam estar visíveis
        const elementsToHide = [
            'searchInfo', 'resultsList', 'pagination', 'errorMessage', 
            'noResults', 'reportButtonContainer', 'pdfReportDiv'
        ];
        
        elementsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });
        
        // Rolar para a área de resultados
        document.getElementById('resultsContainer').scrollIntoView({ behavior: 'smooth' });
        
        // Montar os parâmetros da busca
        const searchParams = {
            search: searchTerm,
            uf: uf,
            modalidade: modalidade,
            status: status,
            page: page
        };
        
        // Armazenar os parâmetros atuais
        currentSearchParams = searchParams;
        currentPage = page;
        
        // Definir URL externa
        const externalUrl = `https://pncp.gov.br/app/editais?q=${encodeURIComponent(searchTerm)}&pagina=${page}&ufs=${uf}&modalidades=${modalidade}&status=${status}`;
        const externalLinkElement = document.getElementById('externalLink');
        if (externalLinkElement) externalLinkElement.href = externalUrl;
        
        // Adicionar indicador visual de carregamento
        document.getElementById('resultsContainer').classList.add('loading-indicator');
        
        // Realizar a busca via API
        fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchParams)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(results => {
            // Armazenar os resultados
            currentResults = results;
            
            // Remover indicador de carregamento
            document.getElementById('resultsContainer').classList.remove('loading-indicator');
            document.getElementById('loadingResults').classList.add('hidden');
            
            // Verificar se houve erro
            if (results.error) {
                const errorElement = document.getElementById('errorMessage');
                if (errorElement) {
                    errorElement.textContent = `Erro ao buscar resultados: ${results.error}`;
                    errorElement.classList.remove('hidden');
                }
                return;
            }
            
            // Verificar se há resultados
            if (!results.items || results.items.length === 0) {
                const noResultsElement = document.getElementById('noResults');
                if (noResultsElement) noResultsElement.classList.remove('hidden');
                return;
            }
            
            // Mostrar informações da busca
            updateSearchInfo(results, searchTerm);
            
            // Limpar resultados anteriores e mostrar apenas a página atual
            renderResults(results.items);
            
            // Atualizar controles de paginação
            updatePagination(results.pagination);
            
            // Mostrar botão para gerar relatório
            const reportButtonContainer = document.getElementById('reportButtonContainer');
            if (reportButtonContainer) reportButtonContainer.classList.remove('hidden');
            
        })
        .catch(error => {
            console.error('Erro na busca:', error);
            document.getElementById('loadingResults').classList.add('hidden');
            document.getElementById('resultsContainer').classList.remove('loading-indicator');
            
            const errorElement = document.getElementById('errorMessage');
            if (errorElement) {
                errorElement.textContent = `Erro ao buscar resultados: ${error.message}`;
                errorElement.classList.remove('hidden');
            }
        });
        
    } catch (error) {
        console.error('Erro na função de busca:', error);
        
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = `Erro na função de busca: ${error.message}`;
            errorElement.classList.remove('hidden');
        }
        
        document.getElementById('loadingResults').classList.add('hidden');
    }
}

// Função auxiliar para atualizar as informações de busca
function updateSearchInfo(results, searchTerm) {
    // Obter elementos
    const statusDisplay = document.getElementById('statusDisplay');
    const searchTermDisplay = document.getElementById('searchTermDisplay');
    const exibindoDisplay = document.getElementById('exibindoDisplay');
    const totalDisplay = document.getElementById('totalDisplay');
    const searchTimeDisplay = document.getElementById('searchTimeDisplay');
    const searchInfo = document.getElementById('searchInfo');
    
    // Verificar se os elementos existem antes de tentar atualizá-los
    if (statusDisplay) statusDisplay.textContent = results.info.status || 'Encerradas';
    if (searchTermDisplay) searchTermDisplay.textContent = searchTerm;
    if (exibindoDisplay) exibindoDisplay.textContent = results.info.exibindo || results.items.length;
    if (totalDisplay) totalDisplay.textContent = results.info.total || results.items.length;
    if (searchTimeDisplay) searchTimeDisplay.textContent = results.search_time || '-';
    
    // Mostrar as informações
    if (searchInfo) searchInfo.classList.remove('hidden');
    
    // Mostrar a lista de resultados
    const resultsList = document.getElementById('resultsList');
    if (resultsList) resultsList.classList.remove('hidden');
}

// Função auxiliar para atualizar os controles de paginação
function updatePagination(paginationInfo) {
    const pagination = document.getElementById('pagination');
    const currentPageElement = document.getElementById('currentPage'); 
    const totalPagesElement = document.getElementById('totalPages');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const paginationInfoElement = document.getElementById('paginationInfo');
    
    // Verificar se os elementos de paginação existem
    if (!pagination || !currentPageElement || !totalPagesElement || 
        !prevPageButton || !nextPageButton || !paginationInfoElement) {
        console.error('Elementos de paginação não encontrados');
        return;
    }
    
    // Atualizar informações da página
    currentPageElement.textContent = paginationInfo.current_page;
    totalPagesElement.textContent = paginationInfo.total_pages;
    
    // Atualizar estado dos botões
    prevPageButton.disabled = paginationInfo.current_page <= 1;
    nextPageButton.disabled = paginationInfo.current_page >= paginationInfo.total_pages;
    
    // Mostrar informação visual da página atual
    paginationInfoElement.innerHTML = `
        <span class="pagination-info">Página ${paginationInfo.current_page} de ${paginationInfo.total_pages}</span>
    `;
    
    // Mostrar controles de paginação
    pagination.classList.remove('hidden');
}

// Função auxiliar para renderizar os resultados
function renderResults(items) {
    const resultsList = document.getElementById('resultsList');
    if (!resultsList) {
        console.error('Elemento de lista de resultados não encontrado');
        return;
    }
    
    // Limpar resultados anteriores
    resultsList.innerHTML = '';
    
    // Verificar se há itens para renderizar
    if (!items || items.length === 0) {
        console.warn('Nenhum item para renderizar');
        return;
    }
    
    // Renderizar cada item na lista
    items.forEach(item => {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150';
        
        // Garantir que todos os campos existam ou fornecer valores padrão
        const numero = item.numero || 'N/A';
        const id_contratacao = item.id_contratacao || 'N/A';
        const url = item.url || '#';
        const modalidade = item.modalidade || 'N/A';
        const data = item.data || 'N/A';
        const orgao = item.orgao || 'N/A';
        const local = item.local || 'N/A';
        const objeto = item.objeto || 'N/A';
        
        resultCard.innerHTML = `
            <a href="${url}" target="_blank" class="block">
                <div class="flex justify-between">
                    <div class="flex-1">
                        <div class="font-bold text-gray-800 dark:text-white mb-1">Edital nº ${numero}</div>
                        <div class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            <span class="font-medium">Id contratação PNCP:</span> ${id_contratacao}
                        </div>
                        <div class="flex flex-wrap gap-4 mb-2 text-sm">
                            <div><span class="font-medium">Modalidade da Contratação:</span> ${modalidade}</div>
                            <div><span class="font-medium">Última Atualização:</span> ${data}</div>
                        </div>
                        <div class="flex flex-wrap gap-4 mb-2 text-sm">
                            <div><span class="font-medium">Órgão:</span> ${orgao}</div>
                            <div><span class="font-medium">Local:</span> ${local}</div>
                        </div>
                        <div class="text-sm text-gray-700 dark:text-gray-300 truncate-2-lines">
                            <span class="font-medium">Objeto:</span> ${objeto}
                        </div>
                    </div>
                    <div class="ml-4 text-indigo-600 dark:text-indigo-400 self-center">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </a>
        `;
        
        resultsList.appendChild(resultCard);
    });
}

// Função para gerar o relatório PDF
function generatePDFReport() {
    if (!currentResults || !currentResults.items || currentResults.items.length === 0) {
        alert('Não há resultados para gerar o relatório.');
        return;
    }
    
    try {
        // Mostrar a seção de relatório e indicador de carregamento
        const pdfReportDiv = document.getElementById('pdfReportDiv');
        const reportContent = document.getElementById('reportContent');
        
        if (!pdfReportDiv || !reportContent) {
            console.error('Elementos de relatório não encontrados');
            return;
        }
        
        pdfReportDiv.classList.remove('hidden');
        reportContent.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400 mb-2"></div>
                <p class="text-gray-600 dark:text-gray-400">Gerando relatório...</p>
            </div>
        `;
        
        // Rolar para a área do relatório
        pdfReportDiv.scrollIntoView({ behavior: 'smooth' });
        
        // Solicitar geração do relatório via API
        fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                search_params: currentSearchParams,
                results: currentResults
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Gerar conteúdo do relatório
            const reportData = data.report_data;
            const searchParams = reportData.search_params;
            const resultsInfo = reportData.results_info;
            const items = reportData.items;
            
            // Criar tabela de resultados
            let resultsTableHTML = `
                <table class="w-full border-collapse mb-4">
                    <thead>
                        <tr class="bg-gray-50 dark:bg-gray-700">
                            <th class="border px-4 py-2 text-left">Edital</th>
                            <th class="border px-4 py-2 text-left">Órgão</th>
                            <th class="border px-4 py-2 text-left">Local</th>
                            <th class="border px-4 py-2 text-left">Data</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            items.forEach(item => {
                resultsTableHTML += `
                    <tr>
                        <td class="border px-4 py-2">${item.numero || 'N/A'}</td>
                        <td class="border px-4 py-2">${item.orgao || 'N/A'}</td>
                        <td class="border px-4 py-2">${item.local || 'N/A'}</td>
                        <td class="border px-4 py-2">${item.data || 'N/A'}</td>
                    </tr>
                `;
            });
            
            resultsTableHTML += `
                    </tbody>
                </table>
            `;
            
            // Criar o conteúdo do relatório
            const reportContent = `
                <div class="text-center mb-6">
                    <h1 class="text-2xl font-bold mb-1 text-gray-900 dark:text-white">RELATÓRIO DE PESQUISA - PORTAL NACIONAL DE CONTRATAÇÕES PÚBLICAS (PNCP)</h1>
                    <p class="text-gray-600 dark:text-gray-400">Gerado em ${reportData.timestamp}</p>
                </div>
                
                <div class="mb-6">
                    <h2 class="text-xl font-bold mb-3 text-gray-800 dark:text-white border-b pb-2">1. Parâmetros da Consulta</h2>
                    <table class="w-full mb-4">
                        <tr class="border-b">
                            <td class="py-2 font-semibold pr-4 w-1/3">Termo de Busca:</td>
                            <td class="py-2">${searchParams.search_term}</td>
                        </tr>
                        <tr class="border-b">
                            <td class="py-2 font-semibold pr-4">Estado (UF):</td>
                            <td class="py-2">${searchParams.uf_label}</td>
                        </tr>
                        <tr class="border-b">
                            <td class="py-2 font-semibold pr-4">Modalidade:</td>
                            <td class="py-2">${searchParams.modalidade_label}</td>
                        </tr>
                        <tr class="border-b">
                            <td class="py-2 font-semibold pr-4">Status:</td>
                            <td class="py-2">${searchParams.status_label}</td>
                        </tr>
                        <tr class="border-b">
                            <td class="py-2 font-semibold pr-4">Total de Resultados:</td>
                            <td class="py-2">${resultsInfo.total}</td>
                        </tr>
                        <tr class="border-b">
                            <td class="py-2 font-semibold pr-4">Página:</td>
                            <td class="py-2">${resultsInfo.current_page} de ${resultsInfo.total_pages}</td>
                        </tr>
                        <tr class="border-b">
                            <td class="py-2 font-semibold pr-4">Data e Hora da Consulta:</td>
                            <td class="py-2">${searchParams.timestamp}</td>
                        </tr>
                    </table>
                </div>
                
                <div class="mb-6">
                    <h2 class="text-xl font-bold mb-3 text-gray-800 dark:text-white border-b pb-2">2. Base Legal</h2>
                    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p class="mb-2">Este relatório atende às exigências da Lei 14.133/2021 (Nova Lei de Licitações e Contratos Administrativos), especificamente:</p>
                        <ul class="list-disc pl-5 space-y-1">
                            <li><strong>Art. 23:</strong> "É vedado optar por modalidade de licitação cuja determinação do valor seja por estimativa, quando for possível definição exata baseada em parâmetros de mercado."</li>
                            <li><strong>Art. 23, § 1º:</strong> "O valor estimado do objeto será definido com base no melhor preço aferido por meio da utilização de parâmetros previstos em regulamento, prioritariamente na seguinte ordem: III - dados de pesquisa publicada em mídia especializada, de tabela de referência formalmente aprovada pelo Poder Executivo federal e de sítios eletrônicos especializados ou de domínio amplo, desde que contenha a data e hora de acesso."</li>
                            <li><strong>Art. 25, § 3º, II:</strong> "O Portal Nacional de Contratações Públicas (PNCP) conterá, entre outras informações, os planos de contratação anuais, os catálogos eletrônicos de padronização, os editais de credenciamento e de pré-qualificação, os avisos de contratação direta e os extratos de contratos firmados."</li>
                        </ul>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h2 class="text-xl font-bold mb-3 text-gray-800 dark:text-white border-b pb-2">3. Resultados da Consulta (Página ${resultsInfo.current_page})</h2>
                    <p class="mb-3">A pesquisa retornou um total de ${resultsInfo.total} resultados. Mostrando ${items.length} resultados da página ${resultsInfo.current_page}:</p>
                    ${resultsTableHTML}
                </div>
            `;
            
            // Adicionar seção de detalhes dos principais resultados, se houver resultados
            if (items.length > 0) {
                let detailsHTML = `
                    <div class="mb-6">
                        <h2 class="text-xl font-bold mb-3 text-gray-800 dark:text-white border-b pb-2">4. Detalhes dos Principais Resultados</h2>
                `;
                
                // Adicionar detalhes dos três primeiros resultados (ou menos, se não houver três)
                const itemsToShow = items.slice(0, Math.min(3, items.length));
                
                itemsToShow.forEach(item => {
                    detailsHTML += `
                        <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h3 class="font-bold mb-2">Edital nº ${item.numero || 'N/A'}</h3>
                            <p><strong>Órgão:</strong> ${item.orgao || 'N/A'}</p>
                            <p><strong>Local:</strong> ${item.local || 'N/A'}</p>
                            <p><strong>ID PNCP:</strong> ${item.id_contratacao || 'N/A'}</p>
                            <p><strong>Objeto:</strong> ${item.objeto || 'N/A'}</p>
                        </div>
                    `;
                });
                
                detailsHTML += `</div>`;
                reportContent += detailsHTML;
            }
            
            // Adicionar observações e recomendações
            reportContent += `
                <div class="mb-6">
                    <h2 class="text-xl font-bold mb-3 text-gray-800 dark:text-white border-b pb-2">5. Observações e Recomendações</h2>
                    <ol class="list-decimal pl-5 space-y-1">
                        <li>Os resultados apresentados são baseados nas informações oficiais disponibilizadas pelo Portal Nacional de Contratações Públicas (PNCP) no momento da consulta.</li>
                        <li>Para fins de pesquisa de preços, considere analisar contratações similares com condições compatíveis ao objeto pretendido, conforme art. 23 da Lei 14.133/2021.</li>
                        <li>É recomendado verificar a integralidade da documentação disponível no PNCP para cada contratação listada.</li>
                        <li>Valores históricos podem precisar de correção monetária para representar adequadamente os preços atuais de mercado.</li>
                        <li>Para processos de contratação com base na Lei 14.133/2021, mantenha este relatório anexado ao processo administrativo para fins de comprovação da pesquisa realizada.</li>
                    </ol>
                </div>
                
                <div class="mt-8 pt-4 border-t text-center text-sm text-gray-600 dark:text-gray-400">
                    <p>Este documento foi gerado automaticamente em ${reportData.timestamp}</p>
                    <p>Em conformidade com a Lei 14.133/2021 - Portal Nacional de Contratações Públicas (PNCP)</p>
                </div>
            `;
            
            // Inserir o conteúdo no elemento de relatório
            document.getElementById('reportContent').innerHTML = reportContent;
            
        })
        .catch(error => {
            console.error('Erro ao gerar relatório:', error);
            reportContent.innerHTML = `
                <div class="text-red-600 dark:text-red-400 p-4">
                    <p class="font-bold mb-2">Erro ao gerar relatório:</p>
                    <p>${error.message}</p>
                </div>
            `;
        });
        
    } catch (error) {
        console.error('Erro na função de geração de relatório:', error);
        alert('Erro ao gerar relatório: ' + error.message);
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Configurar modo escuro
    setupDarkMode();
    
    // Configurar formulário de busca
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch(1);
        });
    }
    
    // Configurar navegação de páginas
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    
    if (prevPageButton) {
        prevPageButton.addEventListener('click', function() {
            if (currentPage > 1) {
                performSearch(currentPage - 1);
            }
        });
    }
    
    if (nextPageButton) {
        nextPageButton.addEventListener('click', function() {
            const totalPagesElement = document.getElementById('totalPages');
            const totalPages = totalPagesElement ? parseInt(totalPagesElement.textContent) : 1;
            
            if (currentPage < totalPages) {
                performSearch(currentPage + 1);
            }
        });
    }
    
    // Configurar botão para gerar PDF
    const generatePDFButton = document.getElementById('generatePDFButton');
    if (generatePDFButton) {
        generatePDFButton.addEventListener('click', generatePDFReport);
    }
    
    // Configurar botão para imprimir
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Execute a busca automaticamente se houver um termo na URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchTermFromUrl = urlParams.get('q');
    if (searchTermFromUrl) {
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.value = searchTermFromUrl;
            performSearch(1);
        }
    }
});