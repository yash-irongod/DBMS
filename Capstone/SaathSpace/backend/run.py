import os
from app import create_app
from app.config import Config

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    print(f"Starting SaathSpace API server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
