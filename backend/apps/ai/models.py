from django.db import models


class KnowledgeDocument(models.Model):

    title = models.CharField(max_length=255)

    file = models.FileField(
        upload_to="knowledge/"
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    is_processed = models.BooleanField(
        default=False
    )

    def __str__(self):
        return self.title