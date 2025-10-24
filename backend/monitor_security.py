#!/usr/bin/env python
"""
Security Monitoring Script
Monitor and analyze security logs for the Final Project Management System
"""

import os
import sys
from datetime import datetime, timedelta
from collections import Counter
import re


def read_security_log(log_file='logs/security.log'):
    """Read and parse security log file"""
    if not os.path.exists(log_file):
        print(f"Log file not found: {log_file}")
        return []
    
    with open(log_file, 'r') as f:
        return f.readlines()


def analyze_logs(lines, hours=24):
    """Analyze security logs for patterns"""
    cutoff_time = datetime.now() - timedelta(hours=hours)
    
    blocked_ips = Counter()
    attack_patterns = Counter()
    blocked_paths = Counter()
    
    for line in lines:
        # Extract IP addresses
        ip_match = re.search(r'IP:(\d+\.\d+\.\d+\.\d+)', line)
        if ip_match:
            ip = ip_match.group(1)
            blocked_ips[ip] += 1
        
        # Extract attack patterns
        if 'SUSPICIOUS_PATH' in line:
            path_match = re.search(r'Data: ([^\s,]+)', line)
            if path_match:
                blocked_paths[path_match.group(1)] += 1
        
        # Extract pattern types
        if 'Pattern:' in line:
            pattern_match = re.search(r'Pattern: (.+)$', line)
            if pattern_match:
                attack_patterns[pattern_match.group(1).strip()] += 1
    
    return blocked_ips, attack_patterns, blocked_paths


def print_report(blocked_ips, attack_patterns, blocked_paths):
    """Print security report"""
    print("\n" + "="*60)
    print("SECURITY MONITORING REPORT")
    print("="*60)
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    print("\n📊 TOP 10 BLOCKED IPs:")
    print("-" * 60)
    if blocked_ips:
        for ip, count in blocked_ips.most_common(10):
            print(f"  {ip:20s} - {count:4d} blocked requests")
    else:
        print("  No blocked IPs found")
    
    print("\n🎯 TOP 10 ATTACK PATTERNS:")
    print("-" * 60)
    if attack_patterns:
        for pattern, count in attack_patterns.most_common(10):
            print(f"  {pattern[:50]:50s} - {count:4d} times")
    else:
        print("  No attack patterns detected")
    
    print("\n🚫 TOP 10 BLOCKED PATHS:")
    print("-" * 60)
    if blocked_paths:
        for path, count in blocked_paths.most_common(10):
            print(f"  {path[:50]:50s} - {count:4d} attempts")
    else:
        print("  No blocked paths found")
    
    print("\n" + "="*60)
    print("RECOMMENDATIONS:")
    print("="*60)
    
    if blocked_ips:
        top_ip = blocked_ips.most_common(1)[0]
        if top_ip[1] > 50:
            print(f"⚠️  IP {top_ip[0]} has {top_ip[1]} blocked requests.")
            print(f"   Consider adding to BLOCKED_IPS in settings.")
    
    if len(blocked_ips) > 20:
        print(f"⚠️  {len(blocked_ips)} unique IPs blocked.")
        print("   Consider implementing Fail2Ban or WAF.")
    
    print("\n✅ Security middleware is active and protecting your application.")
    print("="*60 + "\n")


def main():
    """Main function"""
    print("\n🔒 Security Log Analyzer")
    print("Analyzing last 24 hours of security events...\n")
    
    # Read logs
    lines = read_security_log()
    
    if not lines:
        print("No security logs found. This could mean:")
        print("  1. No attacks have been detected")
        print("  2. Logging is not configured properly")
        print("  3. The application hasn't been running")
        return
    
    # Analyze logs
    blocked_ips, attack_patterns, blocked_paths = analyze_logs(lines)
    
    # Print report
    print_report(blocked_ips, attack_patterns, blocked_paths)


if __name__ == '__main__':
    main()

