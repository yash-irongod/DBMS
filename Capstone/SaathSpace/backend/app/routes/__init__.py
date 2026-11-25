# Blueprint registry
from .health import health_bp
from .reference import reference_bp
from .auth import auth_bp
from .listings import listings_bp
from .roommates import roommates_bp
from .dashboard import dashboard_bp
from .owner import owner_bp
from .admin import admin_bp

__all__ = [
    'health_bp',
    'reference_bp',
    'auth_bp',
    'listings_bp',
    'roommates_bp',
    'dashboard_bp',
    'owner_bp',
    'admin_bp'
]
