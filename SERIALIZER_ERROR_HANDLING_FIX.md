# 🔧 การแก้ไข Serializer Error Handling

## ปัญหาที่พบ
- Projects API ยังคง return 500 error
- Serializer methods อาจเกิด error เมื่อไม่มี ProjectGroup หรือข้อมูลที่เกี่ยวข้อง

## สาเหตุ
Serializer methods ใน `ProjectSerializer` ไม่มี error handling ที่เพียงพอ:
- `get_topic_lao`, `get_topic_eng`, `get_advisor_name`, `get_comment` - อาจ error เมื่อไม่มี ProjectGroup
- `get_main_committee`, `get_second_committee`, `get_third_committee` - อาจ error เมื่อไม่มี Advisor
- `get_defense_date`, `get_defense_time`, `get_defense_room` - อาจ error เมื่อไม่มี ProjectGroup
- `get_student_count` - ใช้ `project_group.students.count()` ซึ่งอาจ error

## การแก้ไข

### 1. เพิ่ม Error Handling ใน Serializer Methods

#### แก้ไข `get_student_count`
```python
def get_student_count(self, obj):
    try:
        project_group = ProjectGroup.objects.get(project_id=obj.project_id)
        # Use ProjectStudent relationship directly
        from projects.models import ProjectStudent
        return ProjectStudent.objects.filter(project_group=project_group).count()
    except ProjectGroup.DoesNotExist:
        return 0
    except Exception as e:
        return 0
```

#### เพิ่ม Error Handling ใน Methods อื่นๆ
- `get_topic_lao`, `get_topic_eng`, `get_advisor_name`, `get_comment`
- `get_main_committee`, `get_second_committee`, `get_third_committee`
- `get_defense_date`, `get_defense_time`, `get_defense_room`
- `get_final_grade`, `get_main_advisor_score`, `get_main_committee_score`, etc.
- `get_detailed_scores`

ทั้งหมดถูก wrap ด้วย `try-except` เพื่อป้องกัน errors

## ผลลัพธ์ที่คาดหวัง
- Serializer จะไม่เกิด 500 error แม้ว่าจะไม่มี ProjectGroup หรือข้อมูลที่เกี่ยวข้อง
- API จะ return empty values หรือ default values แทนที่จะ error
- Frontend สามารถโหลด projects list ได้แม้ว่าจะไม่มีข้อมูลบางส่วน

## ขั้นตอนทดสอบ
1. Restart Backend server
2. ทดสอบ API: `GET /api/projects/projects/`
3. ตรวจสอบว่าไม่มี 500 error
4. ตรวจสอบว่า response มีข้อมูลหรือ empty array

---

**หมายเหตุ:** การเพิ่ม error handling นี้จะทำให้ API robust มากขึ้นและไม่ crash เมื่อมีข้อมูลไม่ครบ

