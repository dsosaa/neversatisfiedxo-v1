import csv
import os
import re
from datetime import datetime

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from trailers.models import TrailerMeta

User = get_user_model()

class Command(BaseCommand):
    help = "Update trailer data from FINALDESCRIPTION CSV file"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str, help="Path to the FINALDESCRIPTION CSV file")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview what would be updated without making changes",
        )
        parser.add_argument(
            "--export-videodb",
            type=str,
            help="Export updated data to VideoDB.csv format at this path",
        )

    def handle(self, *args, **options):
        csv_file = options["csv_file"]
        dry_run = options["dry_run"]
        export_path = options.get("export_videodb")

        # Validate CSV file exists
        if not os.path.exists(csv_file):
            raise CommandError(f'CSV file "{csv_file}" does not exist.')

        # Process updates
        updated_count = 0
        skipped_count = 0
        errors = []

        try:
            with open(csv_file, "r", encoding="utf-8") as file:
                # Use comma as delimiter
                reader = csv.DictReader(file, delimiter=",")

                # Validate required columns
                required_columns = [
                    "video_number",
                    "date",
                    "extracted_text",
                    "creators"
                ]

                missing_columns = [
                    col for col in required_columns if col not in reader.fieldnames
                ]
                if missing_columns:
                    raise CommandError(
                        f'Missing required columns: {", ".join(missing_columns)}'
                    )

                self.stdout.write(f'Found columns: {", ".join(reader.fieldnames)}')
                self.stdout.write("Starting update process...\n")

                for row_num, row in enumerate(reader, start=2):  # Start at 2 for header
                    try:
                        with transaction.atomic():
                            result = self.process_row(row, dry_run)

                            if result == "updated":
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

        # Export VideoDB if requested
        if export_path and not dry_run:
            self.export_videodb_csv(export_path)

        # Print summary
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("UPDATE SUMMARY")
        self.stdout.write("=" * 50)

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No changes were made"))

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
            self.stdout.write(self.style.SUCCESS(f"\nUpdate completed successfully!"))
            if export_path:
                self.stdout.write(self.style.SUCCESS(f"VideoDB.csv exported to: {export_path}"))

    def process_row(self, row, dry_run):
        """Process a single CSV row"""

        # Extract and validate data
        try:
            video_number = int(row["video_number"])
        except (ValueError, KeyError):
            raise ValueError("Invalid or missing video_number")

        date_str = row.get("date", "").strip()
        extracted_text = row.get("extracted_text", "").strip()
        creators = row.get("creators", "").strip()

        if not date_str:
            raise ValueError("Missing date")

        # Parse the date (e.g., "Nov 7, 2020")
        release_date = self.parse_date(date_str)
        if not release_date:
            raise ValueError(f"Could not parse date: {date_str}")

        # Find existing trailer by video number
        try:
            trailer = TrailerMeta.objects.get(video_number=video_number)
        except TrailerMeta.DoesNotExist:
            self.stdout.write(
                f"  Skipping - Video {video_number} not found in database"
            )
            return "skipped"

        if dry_run:
            self.stdout.write(f"  UPDATE: Video {video_number}")
            self.stdout.write(f"    Date: {release_date}")
            self.stdout.write(f"    Description length: {len(extracted_text)} chars")
            self.stdout.write(f"    Creators: {creators[:50]}...")
            return "updated"

        # Update trailer fields
        trailer.release_date = release_date

        # Update detailed_description with extracted_text if provided
        if extracted_text:
            trailer.detailed_description = extracted_text

        # Update creators if provided
        if creators:
            trailer.creators = creators

        trailer.save()

        self.stdout.write(f"  Updated: Video {video_number}")
        return "updated"

    def parse_date(self, date_str):
        """Parse date string in format like 'Nov 7, 2020'"""
        try:
            # Try various date formats
            date_formats = [
                "%b %d, %Y",     # Nov 7, 2020
                "%B %d, %Y",     # November 7, 2020
                "%m/%d/%Y",      # 11/7/2020
                "%Y-%m-%d",      # 2020-11-07
                "%d-%m-%Y",      # 07-11-2020
            ]

            for fmt in date_formats:
                try:
                    return datetime.strptime(date_str, fmt).date()
                except ValueError:
                    continue

            return None
        except Exception:
            return None

    def export_videodb_csv(self, export_path):
        """Export updated trailer data to VideoDB.csv format"""
        try:
            trailers = TrailerMeta.objects.all().select_related('media').order_by('video_number')

            with open(export_path, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = [
                    'Video Number',
                    'Description',
                    'Price',
                    'Length',
                    'Creators',
                    'Video ID',
                    'Thumbnail ID',
                    'Upload Status',
                    'Detailed Description',
                    'Release Date'
                ]

                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()

                for trailer in trailers:
                    writer.writerow({
                        'Video Number': f"Video {trailer.video_number}",
                        'Description': trailer.media.title,
                        'Price': trailer.price,
                        'Length': trailer.length,
                        'Creators': trailer.creators,
                        'Video ID': trailer.cf_video_uid,
                        'Thumbnail ID': trailer.cf_thumb_uid or '',
                        'Upload Status': trailer.upload_status,
                        'Detailed Description': trailer.detailed_description or '',
                        'Release Date': trailer.release_date.strftime('%b %d, %Y') if trailer.release_date else ''
                    })

            self.stdout.write(f"Exported {trailers.count()} trailers to {export_path}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error exporting VideoDB CSV: {str(e)}"))