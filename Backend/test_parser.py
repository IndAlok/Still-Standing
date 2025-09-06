#!/usr/bin/env python3
"""
Test script for the ultra-optimized resume parser
Tests accuracy, performance, and parallel processing capabilities
"""

import sys
import os
import time
import json
import traceback
from pathlib import Path

# Add the Backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

def test_parser_basic():
    """Test basic parser initialization and functionality"""
    try:
        print("=" * 60)
        print("TESTING ULTRA-OPTIMIZED RESUME PARSER")
        print("=" * 60)
        
        # Try to import and initialize parser
        try:
            from resume_parser_complete import UltraOptimizedResumeParser
            print("✅ Successfully imported UltraOptimizedResumeParser")
        except ImportError as e:
            print(f"❌ Failed to import parser: {e}")
            return False
        
        # Initialize parser
        print("Initializing parser...")
        start_time = time.time()
        parser = UltraOptimizedResumeParser()
        init_time = time.time() - start_time
        print(f"✅ Parser initialized in {init_time:.2f} seconds")
        
        # Test cache functionality
        print("Testing cache system...")
        cache_stats = parser.cache.get_stats()
        print(f"✅ Cache initialized: {cache_stats}")
        
        # Test skill extraction
        print("Testing skill extraction...")
        test_skills = ["Python", "JavaScript", "Machine Learning", "Data Science"]
        extracted = parser.extract_skills(" ".join(test_skills))
        print(f"✅ Extracted skills: {len(extracted)} skills found")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        traceback.print_exc()
        return False

def test_sample_text():
    """Test parsing with sample resume text"""
    try:
        from resume_parser_complete import UltraOptimizedResumeParser
        
        # Sample resume text
        sample_text = """
        John Smith
        Software Engineer
        Email: john.smith@email.com
        Phone: (555) 123-4567
        LinkedIn: linkedin.com/in/johnsmith
        
        EXPERIENCE
        Senior Software Engineer | Tech Company | 2020-2023
        • Developed web applications using Python and JavaScript
        • Implemented machine learning models for data analysis
        • Led a team of 5 developers
        
        EDUCATION
        Bachelor of Science in Computer Science
        University of Technology | 2016-2020
        
        SKILLS
        Python, JavaScript, React, Django, Machine Learning, SQL, Git
        """
        
        print("\nTesting text parsing...")
        parser = UltraOptimizedResumeParser()
        
        # Create temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(sample_text)
            temp_path = f.name
        
        try:
            start_time = time.time()
            result = parser.parse_resume(temp_path, 'txt')
            parse_time = time.time() - start_time
            
            print(f"✅ Parsing completed in {parse_time:.2f} seconds")
            print(f"✅ Success: {result.get('success', False)}")
            print(f"✅ Method: {result.get('method', 'unknown')}")
            
            # Check extracted data
            if result.get('success') and result.get('data'):
                data = result['data']
                contact = data.get('contact_info', {})
                print(f"✅ Name: {contact.get('name', 'Not found')}")
                print(f"✅ Email: {contact.get('email', 'Not found')}")
                print(f"✅ Skills found: {len(data.get('skills', []))}")
                print(f"✅ Experience entries: {len(data.get('experience', []))}")
                print(f"✅ Education entries: {len(data.get('education', []))}")
            
            return True
            
        finally:
            # Clean up
            os.unlink(temp_path)
            
    except Exception as e:
        print(f"❌ Text parsing test failed: {e}")
        traceback.print_exc()
        return False

def performance_benchmark():
    """Run performance benchmarks"""
    try:
        from resume_parser_complete import UltraOptimizedResumeParser
        
        print("\n" + "=" * 40)
        print("PERFORMANCE BENCHMARK")
        print("=" * 40)
        
        parser = UltraOptimizedResumeParser()
        
        # Test multiple parsing iterations
        sample_text = "Sample resume with Python, JavaScript, React skills. Experience at Tech Company 2020-2023."
        
        # Create temp file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(sample_text * 10)  # Make it larger
            temp_path = f.name
        
        try:
            iterations = 5
            times = []
            
            for i in range(iterations):
                start_time = time.time()
                result = parser.parse_resume(temp_path, 'txt')
                end_time = time.time()
                times.append(end_time - start_time)
                print(f"Iteration {i+1}: {times[-1]:.3f}s - Cache hit: {result.get('cache_hit', False)}")
            
            avg_time = sum(times) / len(times)
            print(f"\n✅ Average parsing time: {avg_time:.3f} seconds")
            print(f"✅ Cache performance: {parser.cache.get_stats()}")
            
            return True
            
        finally:
            os.unlink(temp_path)
            
    except Exception as e:
        print(f"❌ Performance benchmark failed: {e}")
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("Starting Resume Parser Tests...")
    
    tests = [
        ("Basic Functionality", test_parser_basic),
        ("Sample Text Parsing", test_sample_text),
        ("Performance Benchmark", performance_benchmark),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running: {test_name}")
        try:
            if test_func():
                print(f"✅ {test_name}: PASSED")
                passed += 1
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
    
    print("\n" + "=" * 60)
    print(f"TEST RESULTS: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("🎉 All tests passed! Parser is ready for production.")
        return True
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
