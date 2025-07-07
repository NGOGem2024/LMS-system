import { 
  Box, 
  Skeleton, 
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
  Typography, 
  Paper,
  Backdrop,
  CircularProgress,
  LinearProgress,
  useTheme
} from '@mui/material';

/**
 * Skeleton loader for a course card
 */
export const CourseCardSkeleton = () => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={140} animation="wave" />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ mb: 1 }}>
          <Skeleton variant="text" width={80} height={24} animation="wave" />
        </Box>
        <Skeleton variant="text" height={32} animation="wave" />
        <Skeleton variant="text" height={20} animation="wave" />
        <Skeleton variant="text" height={20} animation="wave" />
        <Skeleton variant="text" height={20} animation="wave" />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="60%" height={20} animation="wave" />
          <Skeleton variant="text" width="40%" height={20} animation="wave" />
        </Box>
      </CardContent>
      <CardActions>
        <Skeleton variant="rectangular" width={100} height={36} animation="wave" />
      </CardActions>
    </Card>
  );
};

/**
 * Grid of course card skeletons
 */
export const CourseGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <Grid container spacing={3}>
      {Array(count).fill(0).map((_, index) => (
        <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
          <CourseCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
};

/**
 * Skeleton for an assignment list item
 */
export const AssignmentItemSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        <Skeleton variant="circular" width={40} height={40} animation="wave" />
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" height={28} width="80%" animation="wave" />
        <Skeleton variant="text" height={20} width="50%" animation="wave" />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Skeleton variant="text" height={20} width="30%" animation="wave" />
          <Skeleton variant="rectangular" width={80} height={30} animation="wave" />
        </Box>
      </Box>
    </Box>
  );
};

/**
 * List of assignment skeletons
 */
export const AssignmentListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <Box>
      {Array(count).fill(0).map((_, index) => (
        <AssignmentItemSkeleton key={index} />
      ))}
    </Box>
  );
};

/**
 * Skeleton for a dashboard card
 */
export const DashboardCardSkeleton = ({ height = 350 }: { height?: number }) => {
  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} animation="wave" />
        <Skeleton variant="text" width={150} height={32} animation="wave" />
      </Box>
      <Skeleton variant="rectangular" height={1} sx={{ mb: 2 }} animation="wave" />
      <Box sx={{ flexGrow: 1 }}>
        <Skeleton variant="rectangular" height="100%" animation="wave" />
      </Box>
    </Paper>
  );
};

/**
 * Skeleton for profile information
 */
export const ProfileSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Skeleton variant="circular" width={120} height={120} animation="wave" />
      <Skeleton variant="text" width={200} height={32} sx={{ mt: 2 }} animation="wave" />
      <Skeleton variant="text" width={150} height={24} animation="wave" />
      
      <Box sx={{ width: '100%', mt: 4 }}>
        <Skeleton variant="text" height={60} animation="wave" />
        <Skeleton variant="text" height={60} animation="wave" />
        <Skeleton variant="text" height={60} animation="wave" />
        <Skeleton variant="text" height={60} animation="wave" />
      </Box>
    </Box>
  );
};

/**
 * Full-screen loading overlay with circular progress
 */
export const LoadingOverlay = ({ open }: { open: boolean }) => {
  const theme = useTheme();
  
  return (
    <Backdrop
      sx={{ 
        color: '#fff', 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }}
      open={open}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

/**
 * Linear progress for page loading
 */
export const PageLoading = () => {
  return (
    <Box sx={{ width: '100%', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <LinearProgress />
    </Box>
  );
};

/**
 * Generic content placeholder with customizable number of lines
 */
export const ContentPlaceholder = ({ lines = 3, animate = true }: { lines?: number, animate?: boolean }) => {
  return (
    <Box sx={{ width: '100%' }}>
      {Array(lines).fill(0).map((_, index) => (
        <Skeleton 
          key={index}
          variant="text" 
          height={24} 
          width={`${Math.random() * 50 + 50}%`} 
          animation={animate ? "wave" : false}
          sx={{ mb: 1 }}
        />
      ))}
    </Box>
  );
};

/**
 * Table skeleton loader
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', py: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
        {Array(cols).fill(0).map((_, index) => (
          <Box key={index} sx={{ flex: 1, px: 1 }}>
            <Skeleton variant="text" height={24} animation="wave" />
          </Box>
        ))}
      </Box>
      
      {/* Data rows */}
      {Array(rows).fill(0).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          {Array(cols).fill(0).map((_, colIndex) => (
            <Box key={colIndex} sx={{ flex: 1, px: 1 }}>
              <Skeleton variant="text" height={20} animation="wave" />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

/**
 * Loading button state component
 */
export const LoadingButton = ({ loading, children }: { loading: boolean, children: React.ReactNode }) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {children}
      {loading && (
        <CircularProgress
          size={24}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-12px',
            marginLeft: '-12px',
          }}
        />
      )}
    </Box>
  );
}; 