from django.db import migrations


def create_exam_types(apps, schema_editor):

    ExamType = apps.get_model(
        'marks',
        'ExamType'
    )

    default_types = [

        {
            'name': 'Class Test',
            'max_marks': 30
        },

        {
            'name': 'Mid Sem',
            'max_marks': 50
        },

        {
            'name': 'End Sem/PUT',
            'max_marks': 70
        },

        {
            'name': 'Practical',
            'max_marks': 50
        },

        {
            'name': 'Assignment',
            'max_marks': 10
        }

    ]

    for exam in default_types:

        ExamType.objects.get_or_create(
            name=exam['name'],
            defaults={
                'max_marks': exam['max_marks']
            }
        )


class Migration(migrations.Migration):

    dependencies = [
        ('marks', '0004_examschedule'),
    ]

    operations = [
        migrations.RunPython(
            create_exam_types
        ),
    ]