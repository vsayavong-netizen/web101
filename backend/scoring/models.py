from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class ScoringCriteria(models.Model):
    """Scoring criteria for project evaluation."""
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    weight = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Weight as percentage (0.0 to 1.0)"
    )
    max_score = models.FloatField(default=100.0)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'scoring_criteria'
        verbose_name = 'Scoring Criteria'
        verbose_name_plural = 'Scoring Criteria'
        ordering = ['weight', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.weight*100:.1f}%)"


class ScoringRubric(models.Model):
    """Scoring rubric for different project types."""
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    project_type = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'scoring_rubrics'
        verbose_name = 'Scoring Rubric'
        verbose_name_plural = 'Scoring Rubrics'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ScoringRubricCriteria(models.Model):
    """Criteria within a scoring rubric."""
    
    rubric = models.ForeignKey(ScoringRubric, on_delete=models.CASCADE, related_name='criteria')
    criteria = models.ForeignKey(ScoringCriteria, on_delete=models.CASCADE)
    weight = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Weight within this rubric (0.0 to 1.0)"
    )
    order = models.IntegerField(default=1)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'scoring_rubric_criteria'
        verbose_name = 'Scoring Rubric Criteria'
        verbose_name_plural = 'Scoring Rubric Criteria'
        ordering = ['rubric', 'order']
        unique_together = ['rubric', 'criteria']
    
    def __str__(self):
        return f"{self.rubric.name} - {self.criteria.name}"


class ProjectScore(models.Model):
    """Project scoring record."""
    
    project_group = models.ForeignKey('projects.ProjectGroup', on_delete=models.CASCADE, related_name='scores')
    rubric = models.ForeignKey(ScoringRubric, on_delete=models.CASCADE)
    scorer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_scores', null=True, blank=True)
    
    # Overall scores
    total_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    max_possible_score = models.FloatField(default=100.0)
    
    # Scoring details
    scoring_notes = models.TextField(blank=True, null=True)
    is_final = models.BooleanField(default=False)
    
    # Timestamps
    scored_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_scores'
        verbose_name = 'Project Score'
        verbose_name_plural = 'Project Scores'
        ordering = ['-scored_at']
        unique_together = ['project_group', 'scorer', 'rubric']
    
    def __str__(self):
        return f"{self.project_group.project_id} - {self.total_score}/{self.max_possible_score}"
    
    @property
    def percentage_score(self):
        """Calculate percentage score."""
        if self.max_possible_score == 0:
            return 0
        return (self.total_score / self.max_possible_score) * 100


class ProjectScoreDetail(models.Model):
    """Detailed scoring for each criteria."""
    
    project_score = models.ForeignKey(ProjectScore, on_delete=models.CASCADE, related_name='details')
    criteria = models.ForeignKey(ScoringCriteria, on_delete=models.CASCADE, null=True, blank=True)
    score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    max_score = models.FloatField(default=100.0)
    notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_score_details'
        verbose_name = 'Project Score Detail'
        verbose_name_plural = 'Project Score Details'
        ordering = ['project_score', 'criteria']
        unique_together = ['project_score', 'criteria']
    
    def __str__(self):
        return f"{self.project_score.project_group.project_id} - {self.criteria.name}: {self.score}"


class DefenseScore(models.Model):
    """Defense presentation scoring."""
    
    project_group = models.ForeignKey('projects.ProjectGroup', on_delete=models.CASCADE, related_name='defense_scores')
    scorer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='defense_scores')
    
    # Defense criteria scores
    presentation_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Presentation quality (0-100)"
    )
    technical_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Technical content (0-100)"
    )
    qa_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Q&A performance (0-100)"
    )
    
    # Overall defense score
    total_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    
    # Feedback
    feedback = models.TextField(blank=True, null=True)
    recommendations = models.TextField(blank=True, null=True)
    
    # Timestamps
    scored_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'defense_scores'
        verbose_name = 'Defense Score'
        verbose_name_plural = 'Defense Scores'
        ordering = ['-scored_at']
        unique_together = ['project_group', 'scorer']
    
    def __str__(self):
        return f"{self.project_group.project_id} Defense - {self.total_score}"
    
    def save(self, *args, **kwargs):
        # Calculate total score as weighted average
        self.total_score = (
            self.presentation_score * 0.3 +
            self.technical_score * 0.5 +
            self.qa_score * 0.2
        )
        super().save(*args, **kwargs)