import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Chip,
  Stack,
  alpha,
  Divider,
  Grid,
} from '@mui/material';
import {
  School as AcademicCapIcon,
  People as UserGroupIcon,
  BarChart as ChartBarIcon,
  Settings as CogIcon,
  ArrowForward as ArrowRightIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Shield as ShieldCheckIcon,
  Schedule as ClockIcon,
  Description as DocumentTextIcon,
  Notifications as BellIcon,
  VpnKey as KeyIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

interface WelcomePageProps {
  onLogin: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onLogin }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: AcademicCapIcon,
      title: "ລະບົບຈັດການບົດໂຄງການຈົບຊັ້ນ",
      description: "ຈັດການບົດໂຄງການຈົບຊັ້ນຂອງນັກສຶກສາຢ່າງຄົບວົງຈອນ ຕັ້ງແຕ່ການລົງທະບຽນຈົນເຖິງການສົ່ງວຽກສຸດທ້າຍ"
    },
    {
      icon: UserGroupIcon,
      title: "ການຈັດການຜູ້ໃຊ້",
      description: "ຮອງຮັບບົດບາດຜູ້ໃຊ້ຫຼາກຫຼາຍ: ນັກສຶກສາ, ອາຈານທີ່ປຶກສາ, ຜູ້ດູແລພາກວິຊາ, ແລະ ຜູ້ດູແລລະບົບ"
    },
    {
      icon: ChartBarIcon,
      title: "ວິເຄາະ ແລະ ລາຍງານ",
      description: "ລະບົບວິເຄາະຂໍ້ມູນ ແລະ ສ້າງລາຍງານສະຖິຕິເພື່ອການຕັດສິນໃຈທີ່ແມ່ນຍຳ"
    },
    {
      icon: CogIcon,
      title: "ການຕັ້ງຄ່າຂັ້ນສູງ",
      description: "ລະບົບຕັ້ງຄ່າທີ່ຍືດຫຍຸ່ນຮອງຮັບຄວາມຕ້ອງການຂອງແຕ່ລະພາກວິຊາ ແລະ ມະຫາວິທະຍາໄລ"
    }
  ];

  const stats = [
    { label: "ນັກສຶກສາ", value: "500+", icon: UserGroupIcon },
    { label: "ອາຈານທີ່ປຶກສາ", value: "50+", icon: AcademicCapIcon },
    { label: "ໂປຣເຈັກທີ່ດຳເນີນການ", value: "200+", icon: DocumentTextIcon },
    { label: "ຄວາມພໍໃຈ", value: "98%", icon: StarIcon }
  ];

  const benefits = [
    { icon: CheckCircleIcon, title: "ໃຊ້ງານງ່າຍ", description: "ອິນເຕີເຟດທີ່ໃຊ້ງານງ່າຍ ເຂົ້າໃຈໄດ້ທັນທີ ບໍ່ຕ້ອງຮຽນຮູ້ນານ", color: 'success' },
    { icon: ClockIcon, title: "ປະຫຍັດເວລາ", description: "ລະບົບອັດຕະໂນມັດຊ່ວຍຫຼຸດເວລາການເຮັດວຽກ ແລະ ເພີ່ມປະສິດທິພາບ", color: 'info' },
    { icon: BellIcon, title: "ແຈ້ງເຕືອນອັດຕະໂນມັດ", description: "ລະບົບແຈ້ງເຕືອນທີ່ຊ່ວຍໃຫ້ບໍ່ພາດກຳນົດການສຳຄັນ", color: 'secondary' }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: (theme) => alpha(theme.palette.primary.light, 0.05) }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ bgcolor: 'background.paper', backdropFilter: 'blur(8px)', boxShadow: 1 }}>
        <Toolbar>
          <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2, sm: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #1976d2 0%, #5e35b1 100%)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AcademicCapIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="h6" fontWeight="bold" color="text.primary">EduInfo</Typography>
                <Typography variant="caption" color="text.secondary">Final Project Management System</Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              onClick={onLogin}
              endIcon={<ArrowRightIcon />}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #5e35b1 100%)',
                boxShadow: 3,
                '&:hover': { boxShadow: 6 }
              }}
            >
              ເຂົ້າສູ່ລະບົບ
            </Button>
          </Container>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 15 } }}>
        <Box sx={{
          textAlign: 'center',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 1s ease-in-out'
        }}>
          <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3.5rem' } }}>
            <Typography variant="h4" component="span" display="block" color="text.secondary" mb={1} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              ລະບົບຈັດການ
            </Typography>
            <Typography variant="h2" component="span" sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #5e35b1 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
              fontSize: { xs: '2rem', md: '3.5rem' }
            }}>
              ບົດໂຄງການຈົບຊັ້ນ
            </Typography>
            <Typography variant="h4" component="span" display="block" color="text.secondary" mt={1} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              ທີ່ທັນສະໄໝ ແລະ ຄົບຖ້ວນ
            </Typography>
          </Typography>
          
          <Typography variant="h6" color="text.secondary" maxWidth="800px" mx="auto" mb={2} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            ລະບົບຈັດການບົດໂຄງການຈົບຊັ້ນທີ່ອອກແບບມາເພື່ອຮອງຮັບຄວາມຕ້ອງການຂອງມະຫາວິທະຍາໄລຍຸໃໝ່
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth="800px" mx="auto" mb={4}>
            ດ້ວຍເຕັກໂນໂລຢີທີ່ທັນສະໄໝ ແລະ ໃຊ້ງານງ່າຍ
          </Typography>
          
          {/* Security Badges */}
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" mb={4} gap={1}>
            <Chip icon={<ShieldCheckIcon />} label="ຄວາມປອດໄພລະດັບ A+" color="success" />
            <Chip icon={<LockIcon />} label="HTTPS ປອດໄພ" color="info" />
            <Chip icon={<KeyIcon />} label="JWT Authentication" color="secondary" />
          </Stack>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={onLogin}
              endIcon={<ArrowRightIcon />}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #5e35b1 100%)',
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                boxShadow: 3,
                '&:hover': { boxShadow: 6 }
              }}
            >
              ເລີ່ມຕົ້ນໃຊ້ງານ
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              sx={{ px: 4, py: 2, fontSize: '1.1rem' }}
            >
              ຮຽນຮູ້ເພີ່ມເຕີມ
            </Button>
          </Stack>
        </Box>
      </Container>

      {/* Stats Section */}
      <Box sx={{ py: 8, bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5) }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Grid size={{ xs: 6, md: 3 }} key={index}>
                  <Box textAlign="center">
                    <Box sx={{
                      width: 64,
                      height: 64,
                      background: (theme) => alpha(theme.palette.primary.main, 0.1),
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}>
                      <IconComponent sx={{ fontSize: 32, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h3" fontWeight="bold" mb={1} sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>{stat.value}</Typography>
                    <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container id="features" maxWidth="lg" sx={{ py: 10 }}>
        <Box textAlign="center" mb={8}>
          <Typography variant="h3" fontWeight="bold" mb={2}>
            ຄຸນສົມບັດຫຼັກຂອງລະບົບ
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
            ລະບົບທີ່ອອກແບບມາເພື່ອຕອບສະໜອງຄວາມຕ້ອງການຂອງທຸກພາກສ່ວນໃນມະຫາວິທະຍາໄລ
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Card sx={{
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}>
                  <CardContent>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      background: 'linear-gradient(135deg, #1976d2 0%, #5e35b1 100%)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2
                    }}>
                      <IconComponent sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" mb={1.5}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box textAlign="center" mb={8}>
          <Typography variant="h3" fontWeight="bold" mb={2}>
            ຂໍ້ດີຂອງການໃຊ້ລະບົບ
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
            ລະບົບທີ່ອອກແບບມາເພື່ອເພີ່ມປະສິດທິພາບ ແລະ ຄວາມສະດວກໃນການເຮັດວຽກ
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Box textAlign="center">
                  <Box sx={{
                    width: 64,
                    height: 64,
                    bgcolor: (theme) => alpha(theme.palette[benefit.color as 'success' | 'info' | 'secondary'].main, 0.1),
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}>
                    <IconComponent sx={{ fontSize: 32, color: `${benefit.color}.main` }} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" mb={2}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{
        py: 12,
        background: 'linear-gradient(135deg, #424242 0%, #212121 100%)',
        color: 'white'
      }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold" mb={3} color="white">
              ພ້ອມເລີ່ມຕົ້ນໃຊ້ງານແລ້ວຫຼືຍັງ?
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}>
              ເຂົ້າຮ່ວມກັບມະຫາວິທະຍາໄລອື່ນໆ ທີ່ໃຊ້ລະບົບຈັດການບົດໂຄງການຈົບຊັ້ນທີ່ທັນສະໄໝທີ່ສຸດ
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={onLogin}
              endIcon={<ArrowRightIcon />}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #5e35b1 100%)',
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                boxShadow: 6,
                '&:hover': { boxShadow: 10 }
              }}
            >
              ເລີ່ມຕົ້ນໃຊ້ງານຕອນນີ້
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #1976d2 0%, #5e35b1 100%)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AcademicCapIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" fontWeight="bold">EduInfo</Typography>
              </Box>
              <Typography variant="body2" color="grey.400">
                ລະບົບຈັດການບົດໂຄງການຈົບຊັ້ນທີ່ທັນສະໄໝ ແລະ ຄົບຖ້ວນສຳລັບມະຫາວິທະຍາໄລ
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>ລະບົບຫຼັກ</Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="grey.400">ຈັດການນັກສຶກສາ</Typography>
                <Typography variant="body2" color="grey.400">ຈັດການອາຈານທີ່ປຶກສາ</Typography>
                <Typography variant="body2" color="grey.400">ຈັດການໂປຣເຈັກ</Typography>
                <Typography variant="body2" color="grey.400">ລະບົບແຈ້ງເຕືອນ</Typography>
              </Stack>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>ຂໍ້ມູນລະບົບ</Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="grey.400">ເວີຊັນ: 1.0.0</Typography>
                <Typography variant="body2" color="grey.400">ສະຖານະ: Online</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShieldCheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="body2" color="success.main">ຄວາມປອດໄພ: A+</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon sx={{ fontSize: 16, color: 'info.main' }} />
                  <Typography variant="body2" color="info.main">HTTPS: ເປີດໃຊ້ງານ</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4, borderColor: 'grey.800' }} />
          
          <Typography variant="body2" textAlign="center" color="grey.500">
            &copy; 2024 EduInfo - Final Project Management System. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default WelcomePage;
