import { useEffect, useState } from "react";
import SubjectCard from "./components/SubjectCard";
import ConfidenceChart from "./components/ConfidenceChart";
import RiskChart from "./components/RiskChart";

export default function Dashboard({ apiUrl, title }) {

    const [subjects, setSubjects] = useState({});
    const [focusSubjects, setFocusSubjects] = useState([]);

    useEffect(() => {
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {

                const subjectsMap = {};
                const focus = [];

                data.forEach(alert => {
                    const subject = alert.subject || "General";

                    subjectsMap[subject] = alert;

                    if (alert.risk_level === "HIGH") {
                        focus.push(subject);
                    }
                });

                setSubjects(subjectsMap);
                setFocusSubjects(focus);
            });
    }, [apiUrl]);

    return (
        <div className="p-6">

            <h1 className="text-2xl font-bold mb-4">{title}</h1>

            {/* AI SUMMARY */}
            <div className="bg-white shadow-lg rounded-2xl p-6 mb-6">
                <h2 className="text-xl font-bold">🤖 AI Summary</h2>

                <p>Total Subjects: {Object.keys(subjects).length}</p>
                <p className="text-red-500">High Risk: {focusSubjects.length}</p>

                <p>
                    {focusSubjects.length > 0
                        ? "🚨 Immediate attention required"
                        : "✅ Performance stable"}
                </p>
            </div>

            {/* SUBJECT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(subjects).map(([sub, data]) => (
                    <SubjectCard key={sub} subject={sub} data={data} />
                ))}
            </div>

            {/* CHARTS */}
            <ConfidenceChart subjects={subjects} />
            <RiskChart subjects={subjects} />

        </div>
    );
}