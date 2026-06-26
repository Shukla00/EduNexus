from rest_framework import serializers
from .models import KnowledgeDocument

class KnowledgeDocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = KnowledgeDocument

        fields = "__all__"