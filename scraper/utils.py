import json
import logging
from datetime import datetime

def format_search_params(search_term, uf="SP", modalidade="6", status="encerradas"):
    """Formata os parâmetros de busca para uso na interface e nos logs"""
    modalidade_labels = {
        "1": "Concorrência",
        "2": "Concurso",
        "3": "Leilão",
        "4": "Pregão",
        "5": "Concorrência Eletrônica",
        "6": "Pregão Eletrônico",
        "7": "Dispensa Eletrônica",
        "8": "Diálogo Competitivo"
    }
    
    status_labels = {
        "receiving": "Recebendo Propostas",
        "judging": "Em Julgamento",
        "encerradas": "Encerradas"
    }
    
    uf_labels = {
        "SP": "São Paulo",
        "RJ": "Rio de Janeiro",
        "MG": "Minas Gerais",
        "RS": "Rio Grande do Sul",
        "PR": "Paraná",
        "SC": "Santa Catarina",
        "BA": "Bahia",
        "ES": "Espírito Santo",
        "GO": "Goiás",
        "DF": "Distrito Federal",
        "MT": "Mato Grosso",
        "MS": "Mato Grosso do Sul",
        "CE": "Ceará",
        "PE": "Pernambuco",
        "PB": "Paraíba",
        "RN": "Rio Grande do Norte",
        "AL": "Alagoas",
        "PI": "Piauí",
        "MA": "Maranhão",
        "TO": "Tocantins",
        "PA": "Pará",
        "AM": "Amazonas",
        "RO": "Rondônia",
        "AC": "Acre",
        "RR": "Roraima",
        "AP": "Amapá",
        "SE": "Sergipe"
    }
    
    return {
        "search_term": search_term,
        "uf": uf,
        "uf_label": f"{uf} ({uf_labels.get(uf, uf)})" if uf in uf_labels else uf,
        "modalidade": modalidade,
        "modalidade_label": modalidade_labels.get(modalidade, "Desconhecido"),
        "status": status,
        "status_label": status_labels.get(status, status.capitalize()),
        "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    }

def generate_pdf_report_data(search_params, results):
    """Gera dados para o relatório PDF baseado nos resultados da busca"""
    items = results.get('items', [])
    info = results.get('info', {})
    pagination = results.get('pagination', {})
    
    return {
        "search_params": search_params,
        "results_info": {
            "total": info.get('total', 0),
            "exibindo": info.get('exibindo', len(items)),
            "search_url": results.get('search_url', ''),
            "current_page": pagination.get('current_page', 1),
            "total_pages": pagination.get('total_pages', 1)
        },
        "items": items,
        "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    }