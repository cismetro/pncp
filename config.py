import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Configurações básicas
DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
SECRET_KEY = os.getenv('SECRET_KEY', 'chave-secreta-para-desenvolvimento')

# Configurações de API - URL atualizada para o ambiente de treinamento
PNCP_API_URL = os.getenv('PNCP_API_URL', 'https://treina.pncp.gov.br/api/pncp')
PNCP_MODO_DEMO = os.getenv('PNCP_MODO_DEMO', 'False').lower() in ('true', '1', 't')

# Configurações de PDF
WKHTMLTOPDF_PATH = os.getenv('WKHTMLTOPDF_PATH', '')