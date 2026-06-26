import pickle
from collections import defaultdict

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.alerts.services.ml_predictor import MODEL_PATH, clear_model_cache
from apps.attendance.models import AttendanceSummary
from apps.marks.models import Mark


class Command(BaseCommand):
    help = "Train the subject pass/fail prediction model from marks and attendance data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--bootstrap",
            action="store_true",
            help="Train a starter model from generated examples when real data is unavailable.",
        )

    def handle(self, *args, **options):
        try:
            from sklearn.dummy import DummyClassifier
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.metrics import accuracy_score
            from sklearn.model_selection import train_test_split
        except ImportError as exc:
            raise CommandError(
                "scikit-learn is required. Run: pip install -r requirements.txt"
            ) from exc

        pass_threshold = getattr(settings, "AI_MARKS_THRESHOLD", 40)
        grouped_marks = defaultdict(list)

        marks = (
            Mark.objects.select_related("student", "course", "exam_type")
            .order_by("student_id", "course_id", "exam_type__order", "entered_at")
        )

        for mark in marks:
            grouped_marks[(mark.student_id, mark.course_id)].append(mark)

        samples = []
        labels = []

        for (student_id, course_id), subject_marks in grouped_marks.items():
            if len(subject_marks) < 4:
                continue

            first_four = subject_marks[:4]
            scores = [float(mark.percentage) for mark in first_four]
            avg_score = sum(scores) / len(scores)

            attendance = (
                AttendanceSummary.objects.filter(
                    student_id=student_id,
                    course_id=course_id,
                )
                .values_list("percentage", flat=True)
                .first()
            )
            attendance = float(attendance) if attendance is not None else 75.0

            samples.append(scores + [attendance, avg_score])
            labels.append("Pass" if avg_score >= pass_threshold else "Fail")

        bootstrapped = False
        if not samples and options["bootstrap"]:
            samples, labels = self._build_bootstrap_samples(pass_threshold)
            bootstrapped = True

        if not samples:
            raise CommandError(
                "No training rows found. Add at least four marks per student/course first, "
                "or run with --bootstrap for a development starter model."
            )

        unique_labels = set(labels)
        if len(unique_labels) == 1:
            model = DummyClassifier(strategy="constant", constant=labels[0])
            model.fit(samples, labels)
            accuracy = 1.0
            note = "Only one class found, trained a constant baseline model."
        else:
            model = RandomForestClassifier(
                n_estimators=120,
                random_state=42,
                class_weight="balanced",
            )

            if len(samples) >= 10:
                x_train, x_test, y_train, y_test = train_test_split(
                    samples,
                    labels,
                    test_size=0.25,
                    random_state=42,
                    stratify=labels,
                )
                model.fit(x_train, y_train)
                accuracy = accuracy_score(y_test, model.predict(x_test))
            else:
                model.fit(samples, labels)
                accuracy = accuracy_score(labels, model.predict(samples))

            note = (
                "Starter model trained from generated examples."
                if bootstrapped
                else "Model trained from marks and attendance data."
            )

        with open(MODEL_PATH, "wb") as model_file:
            pickle.dump(model, model_file)

        clear_model_cache()

        self.stdout.write(self.style.SUCCESS(note))
        self.stdout.write(f"Saved model: {MODEL_PATH}")
        self.stdout.write(f"Training rows: {len(samples)}")
        self.stdout.write(f"Labels: Pass={labels.count('Pass')}, Fail={labels.count('Fail')}")
        self.stdout.write(f"Accuracy: {accuracy:.2%}")

    def _build_bootstrap_samples(self, pass_threshold):
        samples = []
        labels = []

        for ct1 in range(10, 96, 15):
            for ct2 in range(10, 96, 15):
                for s1 in range(10, 96, 20):
                    for s2 in range(10, 96, 20):
                        for attendance in (45, 60, 75, 90):
                            scores = [ct1, ct2, s1, s2]
                            avg_score = sum(scores) / len(scores)
                            samples.append(scores + [attendance, avg_score])
                            labels.append(
                                "Pass"
                                if avg_score >= pass_threshold and attendance >= 60
                                else "Fail"
                            )

        return samples, labels
