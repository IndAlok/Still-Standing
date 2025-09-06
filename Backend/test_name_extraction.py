"""
Test specifically for name extraction improvements
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from resume_parser_complete import UltraOptimizedResumeParser

def test_name_extraction():
    """Test name extraction with various resume formats"""
    
    # Initialize parser
    parser = UltraOptimizedResumeParser()
    
    # Test cases with different name formats
    test_cases = [
        {
            'text': 'John Smith\nSoftware Engineer\nEmail: john.smith@email.com\nPhone: 555-123-4567',
            'expected': 'John Smith'
        },
        {
            'text': 'Jane A. Doe\n\nSenior Developer\nExperience in Python and JavaScript',
            'expected': 'Jane A. Doe'
        },
        {
            'text': 'Michael Johnson\nFull Stack Developer\n\nSummary: Experienced developer...',
            'expected': 'Michael Johnson'
        },
        {
            'text': 'Sarah Elizabeth Wilson\nData Scientist\nLocation: New York, NY',
            'expected': 'Sarah Elizabeth Wilson'
        }
    ]
    
    print("Testing Name Extraction...")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        extracted_name = parser.extract_name(test_case['text'])
        expected = test_case['expected']
        
        print(f"Test {i}:")
        first_line = test_case['text'].split('\n')[0]
        print(f"  Text: {first_line}...")
        print(f"  Expected: {expected}")
        print(f"  Extracted: {extracted_name}")
        print(f"  Result: {'✅ PASS' if extracted_name == expected else '❌ FAIL'}")
        print()

if __name__ == "__main__":
    test_name_extraction()
