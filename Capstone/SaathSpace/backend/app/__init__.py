import logging
from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
from .db import init_db_pool, close_db_pool
from .routes import (
    health_bp,
    reference_bp,
    auth_bp,
    listings_bp,
    roommates_bp,
    dashboard_bp,
    owner_bp,
    admin_bp
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger('saathspace')

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS with credentials for local dev
    CORS(
        app,
        origins=app.config['CORS_ORIGINS'],
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"]
    )
    
    # Initialize connection pool
    with app.app_context():
        try:
            init_db_pool()
        except Exception as e:
            logger.warning(f"Database connection pool initialization deferred or failed: {e}")
            
    # Register API Blueprints
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(reference_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(listings_bp, url_prefix='/api')
    app.register_blueprint(roommates_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(owner_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad Request", "message": str(e)}), 400
        
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not Found", "message": "The requested resource was not found"}), 404
        
    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Internal Server Error: {e}")
        return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred"}), 500

    @app.route('/')
    def root():
        return jsonify({
            "brand": "SaathSpace",
            "tagline": "Find your space. Find your people.",
            "api_status": "operational",
            "documentation": "/api/health"
        }), 200

    return app
