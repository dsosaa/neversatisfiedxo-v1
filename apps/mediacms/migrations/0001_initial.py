# Generated initial migration for TrailerMeta model
import django.db.models.deletion
from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("files", "0001_initial"),  # Depends on MediaCMS files app
    ]

    operations = [
        migrations.CreateModel(
            name="TrailerMeta",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "video_number",
                    models.PositiveIntegerField(
                        help_text="Sequential video number for organization"
                    ),
                ),
                (
                    "cf_video_uid",
                    models.CharField(
                        help_text="Cloudflare Stream video UID",
                        max_length=255,
                        unique=True,
                    ),
                ),
                (
                    "cf_thumb_uid",
                    models.CharField(
                        blank=True,
                        help_text="Cloudflare Stream thumbnail UID",
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "price",
                    models.CharField(
                        default="FREE",
                        help_text="Price as string (e.g., '$20', 'FREE')",
                        max_length=50,
                    ),
                ),
                (
                    "length",
                    models.CharField(
                        help_text="Video length as string (e.g., '25 Minutes', '1 Hour 15 Minutes')",
                        max_length=50,
                    ),
                ),
                (
                    "creators",
                    models.CharField(
                        help_text="Content creators/performers", max_length=200
                    ),
                ),
                (
                    "detailed_description",
                    models.TextField(
                        blank=True,
                        help_text="Extended description with more details",
                        null=True,
                    ),
                ),
                (
                    "upload_status",
                    models.CharField(
                        choices=[
                            ("Pending", "Pending"),
                            ("Processing", "Processing"),
                            ("Complete", "Complete"),
                            ("Error", "Error"),
                        ],
                        default="Pending",
                        help_text="Current upload/processing status",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "tags",
                    models.JSONField(
                        blank=True,
                        default=list,
                        help_text="Additional tags for categorization",
                    ),
                ),
                (
                    "is_featured",
                    models.BooleanField(
                        default=False, help_text="Feature this trailer prominently"
                    ),
                ),
                (
                    "is_premium",
                    models.BooleanField(
                        default=True, help_text="Requires payment/subscription to view"
                    ),
                ),
                (
                    "media",
                    models.OneToOneField(
                        help_text="Associated MediaCMS media object",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="trailer_meta",
                        to="files.media",
                    ),
                ),
            ],
            options={
                "verbose_name": "Trailer Metadata",
                "verbose_name_plural": "Trailer Metadata",
                "db_table": "trailer_meta",
                "ordering": ["-created_at", "video_number"],
            },
        ),
        migrations.AddIndex(
            model_name="trailermeta",
            index=models.Index(
                fields=["cf_video_uid"], name="trailer_me_cf_vide_c1b47c_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="trailermeta",
            index=models.Index(
                fields=["video_number"], name="trailer_me_video_n_d7a8f3_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="trailermeta",
            index=models.Index(
                fields=["upload_status"], name="trailer_me_upload__e2c1e6_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="trailermeta",
            index=models.Index(
                fields=["is_featured"], name="trailer_me_is_feat_9a3d5b_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="trailermeta",
            index=models.Index(
                fields=["created_at"], name="trailer_me_created_2f4a8c_idx"
            ),
        ),
    ]
