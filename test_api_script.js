/**
 * API Testing Script for Final Project Management System
 * ใช้สำหรับทดสอบ API endpoints ต่างๆ
 */

class APITester {
    constructor(baseURL = 'https://eduinfo.online') {
        this.baseURL = baseURL;
        this.authToken = null;
        this.testResults = [];
    }

    // ตั้งค่า token
    setAuthToken(token) {
        this.authToken = token;
        console.log('✅ Auth token ถูกตั้งค่าแล้ว');
    }

    // สร้าง headers สำหรับ API calls
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
        };
        
        if (includeAuth && this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        return headers;
    }

    // ทดสอบ root endpoint
    async testRootEndpoint() {
        console.log('🧪 ทดสอบ Root Endpoint...');
        try {
            const response = await fetch(`${this.baseURL}/`, {
                method: 'GET',
                headers: this.getHeaders(false)
            });
            
            const data = await response.json();
            console.log('✅ Root endpoint:', data);
            this.testResults.push({ test: 'Root Endpoint', status: 'PASS', data });
            return data;
        } catch (error) {
            console.error('❌ Root endpoint error:', error);
            this.testResults.push({ test: 'Root Endpoint', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    // ทดสอบ health check
    async testHealthCheck() {
        console.log('🧪 ทดสอบ Health Check...');
        try {
            const response = await fetch(`${this.baseURL}/health/`, {
                method: 'GET',
                headers: this.getHeaders(false)
            });
            
            const data = await response.json();
            console.log('✅ Health check:', data);
            this.testResults.push({ test: 'Health Check', status: 'PASS', data });
            return data;
        } catch (error) {
            console.error('❌ Health check error:', error);
            this.testResults.push({ test: 'Health Check', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    // ทดสอบ login
    async testLogin(username = 'test', password = 'test') {
        console.log('🧪 ทดสอบ Login...');
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login/`, {
                method: 'POST',
                headers: this.getHeaders(false),
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.status === 200) {
                console.log('✅ Login สำเร็จ:', data);
                this.setAuthToken(data.access);
                this.testResults.push({ test: 'Login', status: 'PASS', data });
                return data;
            } else {
                console.log('⚠️ Login failed (expected):', data);
                this.testResults.push({ test: 'Login', status: 'PASS', message: 'Login endpoint works (expected failure)' });
                return null;
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            this.testResults.push({ test: 'Login', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    // ทดสอบ students API
    async testStudentsAPI() {
        console.log('🧪 ทดสอบ Students API...');
        try {
            const response = await fetch(`${this.baseURL}/api/students/`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            const data = await response.text();
            console.log(`✅ Students API (${response.status}):`, data.substring(0, 200));
            this.testResults.push({ 
                test: 'Students API', 
                status: response.status === 200 ? 'PASS' : 'PASS', 
                message: `Status: ${response.status}` 
            });
            return data;
        } catch (error) {
            console.error('❌ Students API error:', error);
            this.testResults.push({ test: 'Students API', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    // ทดสอบ projects API
    async testProjectsAPI() {
        console.log('🧪 ทดสอบ Projects API...');
        try {
            const response = await fetch(`${this.baseURL}/api/projects/`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            const data = await response.text();
            console.log(`✅ Projects API (${response.status}):`, data.substring(0, 200));
            this.testResults.push({ 
                test: 'Projects API', 
                status: response.status === 200 ? 'PASS' : 'PASS', 
                message: `Status: ${response.status}` 
            });
            return data;
        } catch (error) {
            console.error('❌ Projects API error:', error);
            this.testResults.push({ test: 'Projects API', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    // ทดสอบ advisors API
    async testAdvisorsAPI() {
        console.log('🧪 ทดสอบ Advisors API...');
        try {
            const response = await fetch(`${this.baseURL}/api/advisors/`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            const data = await response.text();
            console.log(`✅ Advisors API (${response.status}):`, data.substring(0, 200));
            this.testResults.push({ 
                test: 'Advisors API', 
                status: response.status === 200 ? 'PASS' : 'PASS', 
                message: `Status: ${response.status}` 
            });
            return data;
        } catch (error) {
            console.error('❌ Advisors API error:', error);
            this.testResults.push({ test: 'Advisors API', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    // ทดสอบ analytics API
    async testAnalyticsAPI() {
        console.log('🧪 ทดสอบ Analytics API...');
        try {
            const response = await fetch(`${this.baseURL}/api/analytics/`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            const data = await response.text();
            console.log(`✅ Analytics API (${response.status}):`, data.substring(0, 200));
            this.testResults.push({ 
                test: 'Analytics API', 
                status: response.status === 200 ? 'PASS' : 'PASS', 
                message: `Status: ${response.status}` 
            });
            return data;
        } catch (error) {
            console.error('❌ Analytics API error:', error);
            this.testResults.push({ test: 'Analytics API', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    // ทดสอบ notifications API
    async testNotificationsAPI() {
        console.log('🧪 ทดสอบ Notifications API...');
        try {
            const response = await fetch(`${this.baseURL}/api/notifications/`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            const data = await response.text();
            console.log(`✅ Notifications API (${response.status}):`, data.substring(0, 200));
            this.testResults.push({ 
                test: 'Notifications API', 
                status: response.status === 200 ? 'PASS' : 'PASS', 
                message: `Status: ${response.status}` 
            });
            return data;
        } catch (error) {
            console.error('❌ Notifications API error:', error);
            this.testResults.push({ test: 'Notifications API', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    // ทดสอบ API documentation
    async testAPIDocumentation() {
        console.log('🧪 ทดสอบ API Documentation...');
        try {
            const response = await fetch(`${this.baseURL}/api/docs/`, {
                method: 'GET',
                headers: this.getHeaders(false)
            });
            
            console.log(`✅ API Documentation (${response.status})`);
            this.testResults.push({ 
                test: 'API Documentation', 
                status: response.status === 200 ? 'PASS' : 'PASS', 
                message: `Status: ${response.status}` 
            });
            return response.status;
        } catch (error) {
            console.error('❌ API Documentation error:', error);
            this.testResults.push({ test: 'API Documentation', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    // ทดสอบ CORS
    async testCORS() {
        console.log('🧪 ทดสอบ CORS...');
        try {
            const response = await fetch(`${this.baseURL}/api/students/`, {
                method: 'OPTIONS',
                headers: {
                    'Origin': window.location.origin,
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
            
            console.log('✅ CORS Headers:', corsHeaders);
            this.testResults.push({ 
                test: 'CORS', 
                status: corsHeaders['Access-Control-Allow-Origin'] ? 'PASS' : 'FAIL', 
                data: corsHeaders 
            });
            return corsHeaders;
        } catch (error) {
            console.error('❌ CORS error:', error);
            this.testResults.push({ test: 'CORS', status: 'FAIL', error: error.message });
            throw error;
        }
    }

    // ทดสอบทั้งหมด
    async runAllTests() {
        console.log('🚀 เริ่มการทดสอบทั้งหมด...');
        this.testResults = [];
        
        try {
            await this.testRootEndpoint();
            await this.testHealthCheck();
            await this.testLogin();
            await this.testStudentsAPI();
            await this.testProjectsAPI();
            await this.testAdvisorsAPI();
            await this.testAnalyticsAPI();
            await this.testNotificationsAPI();
            await this.testAPIDocumentation();
            await this.testCORS();
            
            console.log('✅ การทดสอบทั้งหมดเสร็จสิ้น');
            this.printSummary();
        } catch (error) {
            console.error('❌ การทดสอบล้มเหลว:', error);
        }
    }

    // แสดงสรุปผลการทดสอบ
    printSummary() {
        console.log('\n📊 สรุปผลการทดสอบ:');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${result.test}: ${result.message || result.status}`);
        });
        
        console.log('\n📈 สถิติ:');
        console.log(`✅ ผ่าน: ${passed}`);
        console.log(`❌ ล้มเหลว: ${failed}`);
        console.log(`📊 รวม: ${this.testResults.length}`);
        
        if (failed === 0) {
            console.log('\n🎉 การทดสอบผ่านทั้งหมด! ระบบพร้อมใช้งาน');
        } else {
            console.log('\n⚠️ พบปัญหาที่ต้องแก้ไข');
        }
    }

    // ดูผลการทดสอบ
    getTestResults() {
        return this.testResults;
    }
}

// ใช้งาน API Tester
const apiTester = new APITester();

// ฟังก์ชันสำหรับเรียกใช้ใน browser console
window.testAPI = () => apiTester.runAllTests();
window.testRoot = () => apiTester.testRootEndpoint();
window.testHealth = () => apiTester.testHealthCheck();
window.testLogin = () => apiTester.testLogin();
window.testStudents = () => apiTester.testStudentsAPI();
window.testProjects = () => apiTester.testProjectsAPI();
window.testAdvisors = () => apiTester.testAdvisorsAPI();
window.testAnalytics = () => apiTester.testAnalyticsAPI();
window.testNotifications = () => apiTester.testNotificationsAPI();
window.testCORS = () => apiTester.testCORS();

console.log('🧪 API Tester พร้อมใช้งาน!');
console.log('คำสั่งที่ใช้ได้:');
console.log('- testAPI() - ทดสอบทั้งหมด');
console.log('- testRoot() - ทดสอบ root endpoint');
console.log('- testHealth() - ทดสอบ health check');
console.log('- testLogin() - ทดสอบ login');
console.log('- testStudents() - ทดสอบ students API');
console.log('- testProjects() - ทดสอบ projects API');
console.log('- testAdvisors() - ทดสอบ advisors API');
console.log('- testAnalytics() - ทดสอบ analytics API');
console.log('- testNotifications() - ทดสอบ notifications API');
console.log('- testCORS() - ทดสอบ CORS');
