/**
 * Test script for production connection issues
 * This script helps diagnose authentication and CORS issues
 */

class ProductionConnectionTest {
    constructor() {
        this.apiBaseUrl = 'https://eduinfo.online';
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🔍 เริ่มทดสอบการเชื่อมต่อ Production...\n');
        
        await this.testCORS();
        await this.testAuthentication();
        await this.testTokenStorage();
        await this.testAPIEndpoints();
        
        this.displayResults();
    }

    async testCORS() {
        console.log('1. ทดสอบ CORS Configuration...');
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/`, {
                method: 'OPTIONS',
                headers: {
                    'Origin': 'https://eduinfo.online',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'authorization,content-type'
                }
            });
            
            const corsHeaders = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            };
            
            console.log('   CORS Headers:', corsHeaders);
            
            if (corsHeaders['Access-Control-Allow-Origin']) {
                this.testResults.push({ test: 'CORS', status: 'PASS', details: 'CORS headers present' });
            } else {
                this.testResults.push({ test: 'CORS', status: 'FAIL', details: 'Missing CORS headers' });
            }
        } catch (error) {
            this.testResults.push({ test: 'CORS', status: 'ERROR', details: error.message });
        }
    }

    async testAuthentication() {
        console.log('2. ทดสอบ Authentication Endpoint...');
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://eduinfo.online'
                },
                body: JSON.stringify({
                    username: 'test',
                    password: 'test'
                })
            });
            
            console.log(`   Status: ${response.status}`);
            const data = await response.text();
            console.log(`   Response: ${data.substring(0, 200)}...`);
            
            if (response.status === 400 || response.status === 401) {
                this.testResults.push({ test: 'Authentication', status: 'PASS', details: 'Endpoint accessible (expected auth failure)' });
            } else if (response.status === 404) {
                this.testResults.push({ test: 'Authentication', status: 'FAIL', details: 'Endpoint not found' });
            } else {
                this.testResults.push({ test: 'Authentication', status: 'PASS', details: `Endpoint accessible (status: ${response.status})` });
            }
        } catch (error) {
            this.testResults.push({ test: 'Authentication', status: 'ERROR', details: error.message });
        }
    }

    async testTokenStorage() {
        console.log('3. ทดสอบ Token Storage...');
        try {
            // Check if localStorage is available
            if (typeof localStorage !== 'undefined') {
                const authToken = localStorage.getItem('auth_token');
                const refreshToken = localStorage.getItem('refresh_token');
                
                console.log(`   auth_token: ${authToken ? 'Present' : 'Missing'}`);
                console.log(`   refresh_token: ${refreshToken ? 'Present' : 'Missing'}`);
                
                if (authToken || refreshToken) {
                    this.testResults.push({ test: 'Token Storage', status: 'PASS', details: 'Tokens found in localStorage' });
                } else {
                    this.testResults.push({ test: 'Token Storage', status: 'INFO', details: 'No tokens in localStorage (user not logged in)' });
                }
            } else {
                this.testResults.push({ test: 'Token Storage', status: 'ERROR', details: 'localStorage not available' });
            }
        } catch (error) {
            this.testResults.push({ test: 'Token Storage', status: 'ERROR', details: error.message });
        }
    }

    async testAPIEndpoints() {
        console.log('4. ทดสอบ API Endpoints...');
        const endpoints = [
            '/api/',
            '/api/auth/login/',
            '/api/students/',
            '/api/projects/'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Origin': 'https://eduinfo.online'
                    }
                });
                
                console.log(`   ${endpoint}: ${response.status}`);
                
                if (response.status === 200 || response.status === 401 || response.status === 403) {
                    this.testResults.push({ 
                        test: `API ${endpoint}`, 
                        status: 'PASS', 
                        details: `Accessible (status: ${response.status})` 
                    });
                } else {
                    this.testResults.push({ 
                        test: `API ${endpoint}`, 
                        status: 'FAIL', 
                        details: `Not accessible (status: ${response.status})` 
                    });
                }
            } catch (error) {
                this.testResults.push({ 
                    test: `API ${endpoint}`, 
                    status: 'ERROR', 
                    details: error.message 
                });
            }
        }
    }

    displayResults() {
        console.log('\n📊 ผลการทดสอบ:');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const errors = this.testResults.filter(r => r.status === 'ERROR').length;
        const info = this.testResults.filter(r => r.status === 'INFO').length;
        
        this.testResults.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : 
                         result.status === 'FAIL' ? '❌' : 
                         result.status === 'ERROR' ? '🚨' : 'ℹ️';
            console.log(`${status} ${result.test}: ${result.details}`);
        });
        
        console.log('\n📈 สรุปผลการทดสอบ:');
        console.log(`✅ ผ่าน: ${passed}`);
        console.log(`❌ ล้มเหลว: ${failed}`);
        console.log(`🚨 ข้อผิดพลาด: ${errors}`);
        console.log(`ℹ️ ข้อมูล: ${info}`);
        
        if (failed === 0 && errors === 0) {
            console.log('\n🎉 การทดสอบผ่านทั้งหมด! ระบบพร้อมใช้งาน');
        } else {
            console.log('\n⚠️ พบปัญหาที่ต้องแก้ไข');
        }
    }
}

// Run tests if in browser environment
if (typeof window !== 'undefined') {
    const tester = new ProductionConnectionTest();
    tester.runAllTests();
} else {
    console.log('กรุณาเรียกใช้สคริปต์นี้ในเบราว์เซอร์');
}
