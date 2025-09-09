import csv
import os
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from files.models import Media
from trailers.models import TrailerMeta
from difflib import SequenceMatcher

User = get_user_model()


class Command(BaseCommand):
    help = 'Link existing Media objects to TrailerMeta using CSV data'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to the VideoDB.csv file'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be linked without making changes'
        )

    def similarity(self, a, b):
        """Calculate similarity between two strings"""
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        dry_run = options['dry_run']

        # Validate CSV file exists
        if not os.path.exists(csv_file):
            raise CommandError(f'CSV file "{csv_file}" does not exist.')

        # Get all existing Media objects
        existing_media = {media.title.upper(): media for media in Media.objects.all()}
        self.stdout.write(f'Found {len(existing_media)} existing Media objects')

        # Process CSV and link to TrailerMeta
        linked_count = 0
        skipped_count = 0
        errors = []

        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file, delimiter=',')
                
                self.stdout.write('Starting linking process...\n')

                for row_num, row in enumerate(reader, start=2):  # Start at 2 for header
                    try:
                        with transaction.atomic():
                            result = self.process_row(row, existing_media, dry_run)
                            
                            if result == 'linked':
                                linked_count += 1
                            elif result == 'skipped':
                                skipped_count += 1
                                
                    except Exception as e:
                        error_msg = f'Row {row_num}: {str(e)}'
                        errors.append(error_msg)
                        self.stdout.write(self.style.ERROR(error_msg))

        except Exception as e:
            raise CommandError(f'Error reading CSV file: {str(e)}')

        # Print summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write('LINKING SUMMARY')
        self.stdout.write('='*50)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes were made'))
        
        self.stdout.write(f'Linked: {linked_count}')
        self.stdout.write(f'Skipped: {skipped_count}')
        self.stdout.write(f'Errors: {len(errors)}')
        
        if errors:
            self.stdout.write('\nERRORS:')
            for error in errors[:10]:  # Show first 10 errors
                self.stdout.write(self.style.ERROR(f'  - {error}'))
            if len(errors) > 10:
                self.stdout.write(f'  ... and {len(errors) - 10} more errors')

        if not dry_run and linked_count > 0:
            self.stdout.write(self.style.SUCCESS(f'\nLinking completed successfully!'))

    def process_row(self, row, existing_media, dry_run):
        """Process a single CSV row and link to existing Media"""
        
        # Extract and validate data
        try:
            video_number = int(row['Video Number'].replace('Video ', ''))
        except (ValueError, KeyError):
            raise ValueError('Invalid or missing Video Number')

        title = row.get('Description', '').strip()
        if not title:
            raise ValueError('Missing Description (title)')

        price = row.get('Price', 'FREE').strip()
        length = row.get('Length', '').strip()
        creators = row.get('Creators', '').strip()
        detailed_description = row.get('Detailed Description', '').strip()
        cf_video_uid = row.get('Video ID', '').strip()
        cf_thumb_uid = row.get('Thumbnail ID', '').strip()
        upload_status = row.get('Upload Status', 'Pending').strip()

        if not cf_video_uid:
            self.stdout.write(f'  Skipping Video {video_number} - Missing Video ID')
            return 'skipped'

        # Find matching Media object
        media = None
        title_upper = title.upper()
        
        # First try exact match
        if title_upper in existing_media:
            media = existing_media[title_upper]
        else:
            # Try fuzzy matching
            best_match = None
            best_similarity = 0
            for existing_title, existing_media_obj in existing_media.items():
                similarity = self.similarity(title, existing_title)
                if similarity > best_similarity and similarity > 0.8:  # 80% similarity threshold
                    best_similarity = similarity
                    best_match = existing_media_obj
            
            if best_match:
                media = best_match
                self.stdout.write(f'  Fuzzy match for Video {video_number}: {similarity:.2%}')

        if not media:
            self.stdout.write(f'  Skipping Video {video_number} - No matching Media object found')
            return 'skipped'

        # Check if TrailerMeta already exists for this Media
        if TrailerMeta.objects.filter(media=media).exists():
            self.stdout.write(f'  Skipping Video {video_number} - TrailerMeta already exists')
            return 'skipped'

        # Validate upload status
        valid_statuses = [choice[0] for choice in TrailerMeta.UPLOAD_STATUS_CHOICES]
        if upload_status not in valid_statuses:
            upload_status = 'Complete'  # Default fallback

        if dry_run:
            self.stdout.write(f'  WOULD LINK: Video {video_number} -> Media ID {media.id} - {title[:50]}...')
            return 'linked'

        # Create TrailerMeta linking to existing Media
        trailer = TrailerMeta.objects.create(
            media=media,
            video_number=video_number,
            cf_video_uid=cf_video_uid,
            cf_thumb_uid=cf_thumb_uid,
            price=price,
            length=length,
            creators=creators,
            detailed_description=detailed_description or title,
            upload_status=upload_status,
            is_premium=price.upper() != 'FREE' and price != '$0',
        )

        self.stdout.write(f'  Linked: Video {video_number} -> Media ID {media.id} - {title[:50]}...')
        return 'linked'