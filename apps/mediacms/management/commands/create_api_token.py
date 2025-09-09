from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = 'Create or get API token for MediaCMS trailer API access'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Username to create token for (default: admin)'
        )
        parser.add_argument(
            '--create-user',
            action='store_true',
            help='Create user if it does not exist'
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email for user creation'
        )

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            # Try to get existing user
            user = User.objects.get(username=username)
            self.stdout.write(f"Found existing user: {username}")
        except User.DoesNotExist:
            if options['create_user']:
                # Create new user
                email = options.get('email', f'{username}@example.com')
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    is_staff=True,
                    is_superuser=True
                )
                self.stdout.write(
                    self.style.SUCCESS(f"Created new user: {username}")
                )
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f"User '{username}' does not exist. "
                        "Use --create-user to create it."
                    )
                )
                return

        # Get or create token
        token, created = Token.objects.get_or_create(user=user)
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f"Created new API token for {username}")
            )
        else:
            self.stdout.write(f"Using existing API token for {username}")

        self.stdout.write("\n" + "="*50)
        self.stdout.write("API Token Configuration:")
        self.stdout.write("="*50)
        self.stdout.write(f"Username: {username}")
        self.stdout.write(f"Token: {token.key}")
        self.stdout.write("\nAdd this to your .env.local file:")
        self.stdout.write(f"MEDIACMS_API_TOKEN={token.key}")
        self.stdout.write("="*50)