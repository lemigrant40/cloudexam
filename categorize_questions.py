#!/usr/bin/env python3
"""
Script to add categories to questions based on keywords
"""
import json
import re

# Category definitions with keywords and percentages
CATEGORIES = {
    "Architecture": {
        "percentage": 14,
        "keywords": [
            "architecture", "cloudera manager", "design", "security", "deployment",
            "network", "topology", "infrastructure", "cluster design", "kerberos",
            "tls", "ssl", "ldap", "authentication", "authorization", "planning"
        ]
    },
    "High Availability": {
        "percentage": 12.5,
        "keywords": [
            "high availability", "ha", "failover", "backup", "recovery",
            "multi-tenant", "namenode ha", "resourcemanager ha", "zookeeper",
            "quorum", "journal", "standby", "active", "replication"
        ]
    },
    "Installation": {
        "percentage": 12.5,
        "keywords": [
            "install", "deployment", "parcels", "cloudera runtime", "cdh",
            "agent", "server installation", "database", "postgresql", "mysql",
            "setup", "initialization", "bootstrap"
        ]
    },
    "Governance": {
        "percentage": 10,
        "keywords": [
            "atlas", "ranger", "classification", "lineage", "metadata",
            "policy", "access control", "audit", "compliance", "risk",
            "data governance", "tag", "entity"
        ]
    },
    "Capacity Management": {
        "percentage": 10,
        "keywords": [
            "capacity", "storage", "disk", "memory", "resources",
            "scaling", "host", "nodes", "decommission", "commission",
            "expand", "extend", "monitor capacity"
        ]
    },
    "Cluster Maintenance": {
        "percentage": 6,
        "keywords": [
            "upgrade", "patch", "maintenance", "update", "rolling restart",
            "version", "downtime", "migration"
        ]
    },
    "HDFS Administration": {
        "percentage": 10,
        "keywords": [
            "hdfs", "namenode", "datanode", "fsck", "balancer",
            "snapshot", "quota", "replication factor", "block",
            "dfs", "filesystem", "distcp"
        ]
    },
    "YARN Administration": {
        "percentage": 10,
        "keywords": [
            "yarn", "resourcemanager", "nodemanager", "queue", "scheduler",
            "capacity scheduler", "fair scheduler", "application", "container",
            "mapreduce", "resource allocation"
        ]
    }
}

def categorize_question(question_text, explanation):
    """Categorize a question based on keywords in question and explanation"""
    combined_text = (question_text + " " + explanation).lower()

    category_scores = {}

    for category, info in CATEGORIES.items():
        score = 0
        for keyword in info["keywords"]:
            # Count occurrences of each keyword
            score += combined_text.count(keyword.lower())
        category_scores[category] = score

    # Return category with highest score
    if max(category_scores.values()) > 0:
        return max(category_scores, key=category_scores.get)

    # Default category if no keywords match
    return "Architecture"

def main():
    # Load questions
    with open('/home/operador/Descargas/CDP_practice/questions.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)

    print(f"Total questions: {len(questions)}")

    # Categorize each question
    category_counts = {cat: 0 for cat in CATEGORIES.keys()}

    for question in questions:
        category = categorize_question(question['question'], question.get('explanation', ''))
        question['category'] = category
        category_counts[category] += 1

    # Display distribution
    print("\nCategory Distribution:")
    print("-" * 50)
    for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(questions)) * 100
        target_percentage = CATEGORIES[category]["percentage"]
        print(f"{category:25} {count:3} questions ({percentage:5.1f}%) [Target: {target_percentage}%]")

    # Save updated questions
    with open('/home/operador/Descargas/CDP_practice/questions.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print("\n✅ Questions categorized and saved!")

if __name__ == "__main__":
    main()
