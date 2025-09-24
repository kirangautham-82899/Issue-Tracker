#!/usr/bin/env python3
"""
Simple test script to verify the Issue Tracker API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    print("Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_get_issues():
    """Test getting all issues"""
    print("Testing GET /issues endpoint...")
    response = requests.get(f"{BASE_URL}/issues")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Total issues: {data['total']}")
    print(f"Issues on page: {len(data['issues'])}")
    print("First issue:", json.dumps(data['issues'][0], indent=2))
    print()

def test_get_single_issue():
    """Test getting a single issue"""
    print("Testing GET /issues/1 endpoint...")
    response = requests.get(f"{BASE_URL}/issues/1")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        issue = response.json()
        print("Issue details:", json.dumps(issue, indent=2))
    print()

def test_create_issue():
    """Test creating a new issue"""
    print("Testing POST /issues endpoint...")
    new_issue = {
        "title": "Test Issue from API",
        "description": "This is a test issue created via API",
        "status": "open",
        "priority": "medium",
        "assignee": "test@example.com"
    }
    response = requests.post(f"{BASE_URL}/issues", json=new_issue)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        created_issue = response.json()
        print("Created issue:", json.dumps(created_issue, indent=2))
        return created_issue['id']
    print()
    return None

def test_update_issue(issue_id):
    """Test updating an issue"""
    if not issue_id:
        return
    
    print(f"Testing PUT /issues/{issue_id} endpoint...")
    update_data = {
        "status": "in_progress",
        "priority": "high"
    }
    response = requests.put(f"{BASE_URL}/issues/{issue_id}", json=update_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        updated_issue = response.json()
        print("Updated issue:", json.dumps(updated_issue, indent=2))
    print()

def test_search_and_filter():
    """Test search and filtering"""
    print("Testing search and filtering...")
    
    # Test search
    response = requests.get(f"{BASE_URL}/issues?search=login")
    print(f"Search for 'login' - Found {response.json()['total']} issues")
    
    # Test status filter
    response = requests.get(f"{BASE_URL}/issues?status=open")
    print(f"Filter by status 'open' - Found {response.json()['total']} issues")
    
    # Test priority filter
    response = requests.get(f"{BASE_URL}/issues?priority=high")
    print(f"Filter by priority 'high' - Found {response.json()['total']} issues")
    
    # Test sorting
    response = requests.get(f"{BASE_URL}/issues?sort_by=title&sort_order=asc")
    issues = response.json()['issues']
    print(f"Sorted by title (asc) - First issue: {issues[0]['title']}")
    
    # Test pagination
    response = requests.get(f"{BASE_URL}/issues?page=1&page_size=2")
    data = response.json()
    print(f"Pagination (page 1, size 2) - Got {len(data['issues'])} issues, total pages: {data['total_pages']}")
    print()

if __name__ == "__main__":
    try:
        print("=== Issue Tracker API Test ===\n")
        
        # Test basic endpoints
        test_health()
        test_get_issues()
        test_get_single_issue()
        
        # Test CRUD operations
        new_issue_id = test_create_issue()
        test_update_issue(new_issue_id)
        
        # Test advanced features
        test_search_and_filter()
        
        print("=== All tests completed! ===")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server.")
        print("Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"Error: {e}")
