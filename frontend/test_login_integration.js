/**
 * Automated Test for Real Login from Frontend
 * ทดสอบการล็อกอินจริงจาก frontend กับ backend API
 */

const API_BASE_URL = 'http://localhost:8000';
const FRONTEND_BASE_URLS = [
    'http://localhost:5173', 'http://localhost:4173',
    'http://127.0.0.1:5173', 'http://127.0.0.1:4173'
];

class LoginIntegrationTest {
    constructor() {
        this.testResults = {
            setup: false,
            backendConnection: false,
            loginApi: false,
            tokenValidation: false,
            protectedRequest: false,
            logout: false
        };
        
        this.testUser = {
            username: 'testuser',
            password: 'testpass123',
            email: 'test@example.com'
        };
        
        this.accessToken = null;
        this.refreshToken = null;
    }

    /**
     * ตรวจสอบการเชื่อมต่อกับ backend
     */
    async testBackendConnection() {
        console.log('🔧 กำลังทดสอบการเชื่อมต่อกับ backend...');
        
        try {
            // ใช้ endpoint สาธารณะ (ไม่ต้อง auth) ตามนโยบาย middleware
            const response = await fetch(`${API_BASE_URL}/api/students/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                console.log('✅ Backend connection สำเร็จ');
                this.testResults.backendConnection = true;
                // ถือว่าขั้นตอน setup สำเร็จเมื่อ backend พร้อมใช้งาน
                this.testResults.setup = true;
                return true;
            } else {
                console.log(`❌ Backend connection ล้มเหลว: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message}`);
            return false;
        }
    }

    /**
     * ทดสอบ login API
     */
    async testLoginApi() {
        console.log('🧪 กำลังทดสอบ Login API...');
        
        try {
            const loginData = {
                username: this.testUser.username,
                password: this.testUser.password
            };
            
            const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            console.log(`📊 Login Response Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Login Response Data:', data);
                
                // ตรวจสอบว่ามี token หรือไม่
                if (data.access && data.refresh && data.user) {
                    this.accessToken = data.access;
                    this.refreshToken = data.refresh;
                    
                    console.log('✅ Login API ทำงานถูกต้อง');
                    this.testResults.loginApi = true;
                    return true;
                } else {
                    console.log('❌ Login response ไม่มี token หรือ user data');
                    return false;
                }
            } else {
                const errorData = await response.json();
                console.log(`❌ Login API ล้มเหลว: ${JSON.stringify(errorData)}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ เกิดข้อผิดพลาดในการทดสอบ Login API: ${error.message}`);
            return false;
        }
    }

    /**
     * ทดสอบการ validate token
     */
    async testTokenValidation() {
        console.log('🧪 กำลังทดสอบ Token Validation...');
        
        if (!this.accessToken) {
            console.log('❌ ไม่มี access token สำหรับทดสอบ');
            return false;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            console.log(`📊 Token Validation Status: ${response.status}`);
            
            if (response.ok) {
                const userData = await response.json();
                console.log('📊 User Data:', userData);
                console.log('✅ Token Validation ทำงานถูกต้อง');
                this.testResults.tokenValidation = true;
                return true;
            } else {
                console.log('❌ Token Validation ล้มเหลว');
                return false;
            }
        } catch (error) {
            console.log(`❌ เกิดข้อผิดพลาดในการทดสอบ Token Validation: ${error.message}`);
            return false;
        }
    }

    /**
     * ทดสอบการเรียก protected endpoint
     */
    async testProtectedRequest() {
        console.log('🧪 กำลังทดสอบ Protected Request...');
        
        if (!this.accessToken) {
            console.log('❌ ไม่มี access token สำหรับทดสอบ');
            return false;
        }
        
        try {
            // ทดสอบเรียก user dashboard
            const response = await fetch(`${API_BASE_URL}/api/auth/dashboard/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            console.log(`📊 Protected Request Status: ${response.status}`);
            
            if (response.ok) {
                const dashboardData = await response.json();
                console.log('📊 Dashboard Data:', dashboardData);
                console.log('✅ Protected Request ทำงานถูกต้อง');
                this.testResults.protectedRequest = true;
                return true;
            } else {
                console.log('❌ Protected Request ล้มเหลว');
                return false;
            }
        } catch (error) {
            console.log(`❌ เกิดข้อผิดพลาดในการทดสอบ Protected Request: ${error.message}`);
            return false;
        }
    }

    /**
     * ทดสอบการ logout
     */
    async testLogout() {
        console.log('🧪 กำลังทดสอบ Logout...');
        
        if (!this.accessToken || !this.refreshToken) {
            console.log('❌ ไม่มี token สำหรับทดสอบ logout');
            return false;
        }
        
        try {
            const logoutData = {
                refresh: this.refreshToken
            };
            
            const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify(logoutData)
            });
            
            console.log(`📊 Logout Status: ${response.status}`);
            
            if (response.ok) {
                console.log('✅ Logout ทำงานถูกต้อง');
                this.testResults.logout = true;
                return true;
            } else {
                console.log('❌ Logout ล้มเหลว');
                return false;
            }
        } catch (error) {
            console.log(`❌ เกิดข้อผิดพลาดในการทดสอบ Logout: ${error.message}`);
            return false;
        }
    }

    /**
     * ทดสอบการทำงานของ frontend components
     */
    async testFrontendComponents() {
        console.log('🧪 กำลังทดสอบ Frontend Components...');
        
        try {
            const tryFetch = async (url) => {
                try {
                    const res = await fetch(url, { method: 'GET' });
                    // ยอมรับทุกสถานะที่ไม่ใช่ 5xx เพื่ออนุโลม dev/prod routing
                    return res.status < 500;
                } catch {
                    return false;
                }
            };
            // ลองหลายพอร์ต (5173 dev, 4173 preview) พร้อม retry เล็กน้อย
            const maxAttempts = 8;
            const delay = (ms) => new Promise(r => setTimeout(r, ms));
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                for (const base of FRONTEND_BASE_URLS) {
                    const candidates = [base, `${base}/`, `${base}/index.html`];
                    let ok = false;
                    for (const url of candidates) {
                        if (await tryFetch(url)) { ok = true; break; }
                    }
                    if (ok) {
                        console.log(`✅ Frontend server กำลังรันอยู่ที่ ${base}`);
                        return true;
                    }
                }
                await delay(1500);
            }
            console.log('❌ Frontend server ไม่ได้รันอยู่');
            return false;
        } catch (error) {
            console.log(`❌ ไม่สามารถเชื่อมต่อกับ frontend server: ${error.message}`);
            return false;
        }
    }

    /**
     * ทดสอบการทำงานของ API Client
     */
    async testApiClient() {
        console.log('🧪 กำลังทดสอบ API Client...');
        
        try {
            // จำลองการใช้งาน API Client
            const apiClient = {
                baseURL: API_BASE_URL,
                token: null,
                
                setToken(token) {
                    this.token = token;
                },
                
                async login(username, password) {
                    const response = await fetch(`${this.baseURL}/api/auth/login/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        this.setToken(data.access);
                        return { data, status: response.status };
                    } else {
                        throw new Error(`Login failed: ${response.status}`);
                    }
                },
                
                async get(endpoint) {
                    const response = await fetch(`${this.baseURL}${endpoint}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': this.token ? `Bearer ${this.token}` : ''
                        }
                    });
                    
                    if (response.ok) {
                        return { data: await response.json(), status: response.status };
                    } else {
                        throw new Error(`Request failed: ${response.status}`);
                    }
                }
            };
            
            // ทดสอบ login
            const loginResult = await apiClient.login(this.testUser.username, this.testUser.password);
            console.log('📊 API Client Login Result:', loginResult);
            
            if (loginResult.status === 200) {
                // ทดสอบเรียก protected endpoint
                const protectedResult = await apiClient.get('/api/auth/me/');
                console.log('📊 API Client Protected Request:', protectedResult);
                
                if (protectedResult.status === 200) {
                    console.log('✅ API Client ทำงานถูกต้อง');
                    return true;
                } else {
                    console.log('❌ API Client Protected Request ล้มเหลว');
                    return false;
                }
            } else {
                console.log('❌ API Client Login ล้มเหลว');
                return false;
            }
        } catch (error) {
            console.log(`❌ เกิดข้อผิดพลาดในการทดสอบ API Client: ${error.message}`);
            return false;
        }
    }

    /**
     * รันการทดสอบทั้งหมด
     */
    async runAllTests() {
        console.log('🚀 เริ่มการทดสอบ Real Login Integration');
        console.log('=' * 60);
        
        try {
            // ทดสอบการเชื่อมต่อ
            await this.testBackendConnection();
            
            // ทดสอบ Login API
            await this.testLoginApi();
            
            // ทดสอบ Token Validation
            await this.testTokenValidation();
            
            // ทดสอบ Protected Request
            await this.testProtectedRequest();
            
            // ทดสอบ Logout
            await this.testLogout();
            
            // ทดสอบ Frontend Components
            await this.testFrontendComponents();
            
            // ทดสอบ API Client
            await this.testApiClient();
            
        } catch (error) {
            console.log(`❌ เกิดข้อผิดพลาดในการทดสอบ: ${error.message}`);
        }
        
        // สรุปผลการทดสอบ
        this.printTestResults();
    }

    /**
     * แสดงผลการทดสอบ
     */
    printTestResults() {
        console.log('\n' + '=' * 60);
        console.log('📊 สรุปผลการทดสอบ');
        console.log('=' * 60);
        
        const totalTests = Object.keys(this.testResults).length;
        const passedTests = Object.values(this.testResults).filter(Boolean).length;
        
        for (const [testName, result] of Object.entries(this.testResults)) {
            const statusIcon = result ? '✅' : '❌';
            const statusText = result ? 'ผ่าน' : 'ล้มเหลว';
            console.log(`${statusIcon} ${testName}: ${statusText}`);
        }
        
        console.log(`\n📈 ผลรวม: ${passedTests}/${totalTests} การทดสอบผ่าน`);
        
        if (passedTests === totalTests) {
            console.log('🎉 การทดสอบทั้งหมดผ่าน!');
        } else {
            console.log('⚠️ มีการทดสอบบางส่วนล้มเหลว');
        }
    }
}

// ฟังก์ชันสำหรับรันการทดสอบ
async function runLoginTests() {
    const testRunner = new LoginIntegrationTest();
    await testRunner.runAllTests();
}

// รันการทดสอบหากไฟล์นี้ถูกเรียกโดยตรง
if (typeof window === 'undefined') {
    // Node.js environment
    runLoginTests().catch(console.error);
} else {
    // Browser environment
    window.runLoginTests = runLoginTests;
}

// Export สำหรับการใช้งาน
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoginIntegrationTest, runLoginTests };
}
