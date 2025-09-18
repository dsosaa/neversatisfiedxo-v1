import csv
import os
import re

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from files.models import Media

from trailers.models import TrailerMeta

User = get_user_model()

class Command(BaseCommand):
    help = "Import trailer data from VideoDB.csv file"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str, help="Path to the VideoDB.csv file")
        parser.add_argument(
            "--user",
            type=str,
            default="admin",
            help="Username to associate with created media objects (default: admin)",
        )
        parser.add_argument(
            "--update",
            action="store_true",
            help="Update existing trailers if they exist",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview what would be imported without making changes",
        )

    def handle(self, *args, **options):
        csv_file = options["csv_file"]
        username = options["user"]
        update_existing = options["update"]
        dry_run = options["dry_run"]

        # Validate CSV file exists
        if not os.path.exists(csv_file):
            raise CommandError(f'CSV file "{csv_file}" does not exist.')

        # Get or create user
        try:
            user = User.objects.get(username=username)
            self.stdout.write(f"Using user: {user.username}")
        except User.DoesNotExist:
            if dry_run:
                self.stdout.write(f"Would create user: {username}")
                user = None
            else:
                user = User.objects.create_user(
                    username=username, email=f"{username}@example.com"
                )
                self.stdout.write(self.style.SUCCESS(f"Created user: {user.username}"))

        # Import data
        imported_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        try:
            with open(csv_file, "r", encoding="utf-8") as file:
                # Use comma as delimiter (VideoDB.csv is comma-delimited)
                reader = csv.DictReader(file, delimiter=",")

                # Validate required columns
                required_columns = [
                    "Video Number",
                    "Description",
                    "Price",
                    "Length",
                    "Creators",
                    "Video ID",
                    "Thumbnail ID",
                    "Upload Status",
                ]

                missing_columns = [
                    col for col in required_columns if col not in reader.fieldnames
                ]
                if missing_columns:
                    raise CommandError(
                        f'Missing required columns: {", ".join(missing_columns)}'
                    )

                self.stdout.write(f'Found columns: {", ".join(reader.fieldnames)}')
                self.stdout.write("Starting import...\n")

                for row_num, row in enumerate(reader, start=2):  # Start at 2 for header
                    try:
                        with transaction.atomic():
                            result = self.process_row(
                                row, user, update_existing, dry_run
                            )

                            if result == "imported":
                                imported_count += 1
                            elif result == "updated":
                                updated_count += 1
                            elif result == "skipped":
                                skipped_count += 1

                    except Exception as e:
                        error_msg = f"Row {row_num}: {str(e)}"
                        errors.append(error_msg)
                        self.stdout.write(self.style.ERROR(error_msg))

                        if not dry_run:
                            # Continue processing other rows
                            continue

        except Exception as e:
            raise CommandError(f"Error reading CSV file: {str(e)}")

        # Print summary
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("IMPORT SUMMARY")
        self.stdout.write("=" * 50)

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No changes were made"))

        self.stdout.write(f"Imported: {imported_count}")
        self.stdout.write(f"Updated: {updated_count}")
        self.stdout.write(f"Skipped: {skipped_count}")
        self.stdout.write(f"Errors: {len(errors)}")

        if errors:
            self.stdout.write("\nERRORS:")
            for error in errors[:10]:  # Show first 10 errors
                self.stdout.write(self.style.ERROR(f"  - {error}"))
            if len(errors) > 10:
                self.stdout.write(f"  ... and {len(errors) - 10} more errors")

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f"\nImport completed successfully!"))

    def process_row(self, row, user, update_existing, dry_run):
        """Process a single CSV row"""

        # Extract and validate data
        try:
            video_number = int(row["Video Number"].replace("Video ", ""))
        except (ValueError, KeyError):
            raise ValueError("Invalid or missing Video Number")

        title = row.get("Description", "").strip()
        if not title:
            raise ValueError("Missing Description (title)")

        price = row.get("Price", "FREE").strip()
        length = row.get("Length", "").strip()
        creators = row.get("Creators", "").strip()
        detailed_description = row.get("Detailed Description", "").strip()
        cf_video_uid = row.get("Video ID", "").strip()
        cf_thumb_uid = row.get("Thumbnail ID", "").strip()
        upload_status = row.get("Upload Status", "Pending").strip()

        if not cf_video_uid:
            raise ValueError("Missing Video ID (cf_video_uid)")

        # Check if trailer already exists
        existing_trailer = TrailerMeta.objects.filter(cf_video_uid=cf_video_uid).first()

        if existing_trailer and not update_existing:
            self.stdout.write(
                f"  Skipping existing trailer: Video {video_number} ({cf_video_uid})"
            )
            return "skipped"

        # Validate upload status
        valid_statuses = [choice[0] for choice in TrailerMeta.UPLOAD_STATUS_CHOICES]
        if upload_status not in valid_statuses:
            upload_status = "Complete"  # Default fallback

        if dry_run:
            action = "UPDATE" if existing_trailer else "CREATE"
            self.stdout.write(f"  {action}: Video {video_number} - {title[:50]}...")
            return "updated" if existing_trailer else "imported"

        # Create or update trailer
        if existing_trailer:
            # Update existing
            media = existing_trailer.media
            media.title = title
            media.description = title  # Use title as description fallback
            media.save()

            # Update trailer metadata
            existing_trailer.video_number = video_number
            existing_trailer.price = price
            existing_trailer.length = length
            existing_trailer.creators = creators
            existing_trailer.detailed_description = detailed_description or title
            existing_trailer.cf_thumb_uid = cf_thumb_uid
            existing_trailer.upload_status = upload_status
            existing_trailer.save()

            self.stdout.write(f"  Updated: Video {video_number} - {title[:50]}...")
            return "updated"

        else:
            # Create new
            media = Media.objects.create(
                title=title,
                description=title,  # Use title as description
                user=user,
                media_type="video",
                state="public",
            )

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
                is_premium=price.upper() != "FREE" and price != "$0",
            )

            self.stdout.write(f"  Created: Video {video_number} - {title[:50]}...")
            return "imported"

    def parse_duration(self, duration_str):
        """Parse duration string like '25 Minutes' or '1 Hour 15 Minutes'"""
        if not duration_str:
            return 0

        # Handle formats like "25 Minutes", "1 Hour 15 Minutes"
        match = re.search(
            r"(\d+)\s*(?:Hour|Hr)s?\s*(\d+)?\s*(?:Minute|Min)s?",
            duration_str,
            re.IGNORECASE,
        )
        if match:
            if "hour" in duration_str.lower():
                hours = int(match.group(1))
                minutes = int(match.group(2)) if match.group(2) else 0
                return hours * 60 + minutes
            else:
                return int(match.group(1))  # Just minutes

        # Try to extract just a number
        match = re.search(r"(\d+)", duration_str)
        if match:
            return int(match.group(1))

        return 0
