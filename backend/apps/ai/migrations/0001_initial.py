from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='KnowledgeDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('file', models.FileField(upload_to='ai_documents/')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('uploaded_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='ai_documents', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-uploaded_at'],
            },
        ),
        migrations.CreateModel(
            name='DocumentChunk',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('page_number', models.PositiveIntegerField(default=1)),
                ('chunk_index', models.PositiveIntegerField(default=0)),
                ('text', models.TextField()),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chunks', to='ai.knowledgedocument')),
            ],
            options={
                'ordering': ['document_id', 'page_number', 'chunk_index'],
            },
        ),
    ]
