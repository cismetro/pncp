from flask import Flask, render_template, request, jsonify, send_file
import os
import json
import logging
from flask_cors import CORS
from datetime import datetime
import tempfile

from scraper.pncp_scraper import PNCPScraper
from scraper.utils import format_search_params, generate_pdf_report_data

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

app = Flask(__name__)
CORS(app)  # Habilitar CORS para permitir requisições de outros domínios

# Criar uma instância do scraper
scraper = PNCPScraper(use_selenium=True)

@app.route('/')
def index():
    """Rota para a página inicial"""
    return render_template('index.html')

@app.route('/api/search', methods=['POST'])
def search():
    """API para realizar busca no PNCP"""
    try:
        data = request.json
        search_term = data.get('search', '')
        uf = data.get('uf', 'SP')
        modalidade = data.get('modalidade', '6')
        status = data.get('status', 'encerradas')
        page = int(data.get('page', 1))
        
        # Validar página
        if page < 1:
            page = 1
        
        # Log da busca com informação de página
        logging.info(f"Realizando busca: termo='{search_term}', uf={uf}, modalidade={modalidade}, status={status}, página={page}")
        
        # Realizar a busca
        start_time = datetime.now()
        results = scraper.search(search_term, uf, modalidade, status, page)
        end_time = datetime.now()
        search_time = (end_time - start_time).total_seconds()
        
        # Verificar se há um erro nos resultados
        if 'error' in results.get('info', {}):
            error_message = results['info']['error']
            logging.error(f"Erro retornado pelo scraper: {error_message}")
            return jsonify({'error': error_message}), 500
        
        # Log dos resultados
        item_count = len(results.get('items', []))
        logging.info(f"Busca concluída em {search_time:.2f}s: {item_count} resultados encontrados na página {page}")
        
        # Verificar se há resultados
        if item_count == 0:
            logging.warning(f"Nenhum resultado encontrado para '{search_term}' na página {page}")
        
        # Formatar os parâmetros de busca para uso na interface
        search_params = format_search_params(search_term, uf, modalidade, status)
        
        # Garantir que a paginação esteja correta
        pagination = results.get('pagination', {})
        if page > pagination.get('total_pages', 1):
            logging.warning(f"Página solicitada ({page}) maior que total de páginas ({pagination.get('total_pages', 1)})")
            # Ajustar para a última página
            page = pagination.get('total_pages', 1)
            pagination['current_page'] = page
        
        # Adicionar tempo de pesquisa ao resultado
        results['search_time'] = f"{search_time:.2f}s"
        results['formatted_params'] = search_params
        
        return jsonify(results)
    except Exception as e:
        logging.error(f"Erro na rota /api/search: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/details/<path:url_encoded>', methods=['GET'])
def get_edital_details(url_encoded):
    """API para obter detalhes de um edital específico"""
    try:
        # Decodificar a URL
        import urllib.parse
        url = urllib.parse.unquote(url_encoded)
        
        # Log da requisição
        logging.info(f"Buscando detalhes do edital: {url}")
        
        # Obter detalhes
        details = scraper.get_edital_details(url)
        
        return jsonify(details)
    except Exception as e:
        logging.error(f"Erro na rota /api/details: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    """API para gerar um relatório PDF com os resultados da busca"""
    try:
        data = request.json
        search_params = data.get('search_params', {})
        results = data.get('results', {})
        
        # Gerar dados para o relatório
        report_data = generate_pdf_report_data(search_params, results)
        
        # Aqui você implementaria a geração real do PDF
        # Por simplicidade, estamos apenas retornando os dados
        return jsonify({
            'status': 'success',
            'message': 'Dados do relatório gerados com sucesso',
            'report_data': report_data
        })
    except Exception as e:
        logging.error(f"Erro na rota /api/generate-pdf: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/healthcheck')
def healthcheck():
    """Rota para verificar se o serviço está funcionando"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })

"""
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
"""    
    
    
# Agora a parte de configuração da porta
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))  # Obtém a porta do ambiente ou usa 5000 como padrão
    app.run(host="0.0.0.0", port=port)  # Inicia o servidor Flask na porta correta
