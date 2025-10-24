
import React from 'react';
import { 
  Timeline, 
  TimelineItem, 
  TimelineSeparator, 
  TimelineConnector, 
  TimelineContent, 
  TimelineDot,
  TimelineOppositeContent,
  timelineOppositeContentClasses
} from '@mui/lab';
import { Typography, Box, Paper } from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Cancel as XCircleIcon, 
  Schedule as ClockIcon 
} from '@mui/icons-material';
import { StatusHistoryItem, ProjectStatus } from '../types';

interface StatusTimelineProps {
  history: StatusHistoryItem[];
}

const statusConfig = {
  [ProjectStatus.Approved]: {
    Icon: CheckCircleIcon,
    color: 'success' as const,
    title: 'Project Approved',
  },
  [ProjectStatus.Rejected]: {
    Icon: XCircleIcon,
    color: 'error' as const,
    title: 'Project Rejected',
  },
  [ProjectStatus.Pending]: {
    Icon: ClockIcon,
    color: 'warning' as const,
    title: 'Project Submitted',
  },
};

const StatusTimeline: React.FC<StatusTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No history available.
      </Typography>
    );
  }

  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Timeline
      sx={{
        [`& .${timelineOppositeContentClasses.root}`]: {
          flex: 0.2,
        },
        p: 0,
        m: 0
      }}
    >
      {sortedHistory.map((item, index) => {
        const config = statusConfig[item.status] || statusConfig[ProjectStatus.Pending];
        const Icon = config.Icon;
        const formattedDate = new Date(item.timestamp).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        // Handle specific title for resubmission or transfer
        let title = config.title;
        if (item.status === ProjectStatus.Pending && item.comment.includes('resubmitted')) {
          title = 'Project Resubmitted';
        } else if (item.status === ProjectStatus.Pending && item.comment.includes('Transferred')) {
          title = 'Project Transferred';
        }

        return (
          <TimelineItem key={`${item.status}-${item.timestamp}`}>
            <TimelineOppositeContent color="text.secondary" variant="caption">
              {formattedDate}
            </TimelineOppositeContent>
            
            <TimelineSeparator>
              <TimelineDot color={config.color}>
                <Icon sx={{ fontSize: 20 }} />
              </TimelineDot>
              {index < sortedHistory.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            
            <TimelineContent>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  by <Box component="span" fontWeight="medium">{item.actorName}</Box>
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mt: 1, 
                    pl: 1.5, 
                    borderLeft: 2, 
                    borderColor: 'divider' 
                  }}
                >
                  {item.comment}
                </Typography>
              </Paper>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
};

export default StatusTimeline;
