from django.apps import AppConfig


class TrailersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'trailers'
    verbose_name = 'Trailer Management'
    
    def ready(self):
        """App initialization - register signals, etc."""
        # Import signal handlers when app is ready
        try:
            import trailers.signals  # noqa
        except ImportError:
            pass