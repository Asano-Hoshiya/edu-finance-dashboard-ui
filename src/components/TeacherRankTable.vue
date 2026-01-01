<template>
  <div class="teacher-rank-container">
    <h3 class="section-title">教师绩效排行榜</h3>
    <div class="table-wrapper">
      <table class="rank-table">
        <thead>
          <tr>
            <th class="col-rank">排名</th>
            <th class="col-name">教师姓名</th>
            <th class="col-subject">授课科目</th>
            <th class="col-courses">授课课程数</th>
            <th class="col-students">学员人数</th>
            <th class="col-income">总收入(元)</th>
            <th class="col-rating">评分</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(teacher, index) in teacherList"
            :key="teacher.id"
            :class="{ 'top-three': index < 3 }"
          >
            <td class="col-rank">
              <span class="rank-badge" :class="getRankClass(index + 1)">
                {{ index + 1 }}
              </span>
            </td>
            <td class="col-name">
              <div class="teacher-info">
                <span class="avatar">{{ teacher.name.charAt(0) }}</span>
                <span class="name">{{ teacher.name }}</span>
              </div>
            </td>
            <td class="col-subject">{{ teacher.subject }}</td>
            <td class="col-courses">{{ teacher.courseCount }}</td>
            <td class="col-students">{{ teacher.studentCount }}</td>
            <td class="col-income">
              <span class="income-value">{{ formatMoney(teacher.income) }}</span>
            </td>
            <td class="col-rating">
              <div class="rating">
                <span class="stars">{{ getStars(teacher.rating) }}</span>
                <span class="rating-value">{{ teacher.rating }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <span class="total-info">共 {{ teacherList.length }} 位教师</span>
      <span class="update-time">更新时间: 2024-01-15 10:30:00</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TeacherRankItem {
  id: number
  name: string
  subject: string
  courseCount: number
  studentCount: number
  income: number
  rating: number
}

// Mock 数据
const teacherList: TeacherRankItem[] = [
  {
    id: 1,
    name: '张明华',
    subject: '高中数学',
    courseCount: 12,
    studentCount: 156,
    income: 89600,
    rating: 4.9
  },
  {
    id: 2,
    name: '李婷婷',
    subject: '初中英语',
    courseCount: 15,
    studentCount: 203,
    income: 76800,
    rating: 4.8
  },
  {
    id: 3,
    name: '王建国',
    subject: '高中物理',
    courseCount: 10,
    studentCount: 128,
    income: 72400,
    rating: 4.9
  },
  {
    id: 4,
    name: '刘思雨',
    subject: '初中语文',
    courseCount: 14,
    studentCount: 175,
    income: 65200,
    rating: 4.7
  },
  {
    id: 5,
    name: '陈晓峰',
    subject: '高中化学',
    courseCount: 8,
    studentCount: 98,
    income: 58900,
    rating: 4.6
  },
  {
    id: 6,
    name: '赵雪梅',
    subject: '小学奥数',
    courseCount: 18,
    studentCount: 220,
    income: 52300,
    rating: 4.8
  },
  {
    id: 7,
    name: '周文博',
    subject: '初中物理',
    courseCount: 11,
    studentCount: 142,
    income: 48700,
    rating: 4.5
  },
  {
    id: 8,
    name: '吴丽娜',
    subject: '高中英语',
    courseCount: 9,
    studentCount: 112,
    income: 45600,
    rating: 4.7
  },
  {
    id: 9,
    name: '郑大伟',
    subject: '初中数学',
    courseCount: 13,
    studentCount: 168,
    income: 42100,
    rating: 4.4
  },
  {
    id: 10,
    name: '孙美玲',
    subject: '小学英语',
    courseCount: 16,
    studentCount: 195,
    income: 38500,
    rating: 4.6
  }
]

const getRankClass = (rank: number): string => {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return 'normal'
}

const formatMoney = (value: number): string => {
  return value.toLocaleString('zh-CN')
}

const getStars = (rating: number): string => {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  let stars = '★'.repeat(fullStars)
  if (hasHalf) stars += '☆'
  return stars
}
</script>

<style scoped>
.teacher-rank-container {
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.table-wrapper {
  overflow-x: auto;
}

.rank-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.rank-table th {
  background-color: #f5f7fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.rank-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  color: #555;
}

.rank-table tbody tr:hover {
  background-color: #f5f9ff;
}

.rank-table tbody tr.top-three {
  background-color: #fffef5;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 600;
  font-size: 13px;
}

.rank-badge.gold {
  background: linear-gradient(135deg, #ffd700, #ffb800);
  color: #fff;
  box-shadow: 0 2px 6px rgba(255, 184, 0, 0.4);
}

.rank-badge.silver {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
  color: #fff;
  box-shadow: 0 2px 6px rgba(168, 168, 168, 0.4);
}

.rank-badge.bronze {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #fff;
  box-shadow: 0 2px 6px rgba(184, 115, 51, 0.4);
}

.rank-badge.normal {
  background-color: #f0f0f0;
  color: #666;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.name {
  font-weight: 500;
  color: #333;
}

.income-value {
  font-weight: 600;
  color: #52c41a;
}

.rating {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stars {
  color: #faad14;
  font-size: 12px;
}

.rating-value {
  font-weight: 500;
  color: #666;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: 13px;
  color: #888;
}

@media (max-width: 768px) {
  .rank-table {
    font-size: 12px;
  }

  .rank-table th,
  .rank-table td {
    padding: 8px 10px;
  }

  .table-footer {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>