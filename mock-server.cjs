// mock-server.cjs
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock 数据
const db = {
  "meta": {
    "code": 200,
    "message": "success",
    "data": {
      "campuses": [
        { "id": "bj01", "name": "北京校区" },
        { "id": "sh01", "name": "上海校区" },
        { "id": "gz01", "name": "广州校区" }
      ],
      "courseTypes": ["PS", "KET", "PET", "FCE", "CAE"]
    }
  },
  "dashboard-summary": {
    "code": 200,
    "message": "success",
    "data": {
      "payCount": 1250,
      "payAmount": 2580000,
      "refundCount": 45,
      "refundAmount": 98000,
      "netAmount": 2482000,
      "refundRateByCount": 0.036,
      "refundRateByAmount": 0.038
    }
  },
  "dashboard-monthly": {
    "code": 200,
    "message": "success",
    "data": {
      "items": [
        { "month": "2025-02", "netAmount": 180000, "payAmount": 200000, "refundAmount": 20000 },
        { "month": "2025-03", "netAmount": 220000, "payAmount": 250000, "refundAmount": 30000 },
        { "month": "2025-04", "netAmount": 195000, "payAmount": 210000, "refundAmount": 15000 },
        { "month": "2025-05", "netAmount": 280000, "payAmount": 300000, "refundAmount": 20000 },
        { "month": "2025-06", "netAmount": 310000, "payAmount": 340000, "refundAmount": 30000 },
        { "month": "2025-07", "netAmount": 150000, "payAmount": 180000, "refundAmount": 30000 },
        { "month": "2025-08", "netAmount": 260000, "payAmount": 280000, "refundAmount": 20000 },
        { "month": "2025-09", "netAmount": 350000, "payAmount": 380000, "refundAmount": 30000 },
        { "month": "2025-10", "netAmount": 290000, "payAmount": 310000, "refundAmount": 20000 },
        { "month": "2025-11", "netAmount": 275000, "payAmount": 300000, "refundAmount": 25000 },
        { "month": "2025-12", "netAmount": 320000, "payAmount": 350000, "refundAmount": 30000 },
        { "month": "2026-01", "netAmount": 180000, "payAmount": 200000, "refundAmount": 20000 }
      ]
    }
  },
  "dashboard-class-type": {
    "code": 200,
    "message": "success",
    "data": {
      "newCount": 35,
      "renewCount": 85,
      "newPayAmount": 850000,
      "renewPayAmount": 1730000,
      "newStudentCount": 420,
      "renewStudentCount": 830
    }
  },
  "dashboard-campus-income": {
    "code": 200,
    "message": "success",
    "data": {
      "items": [
        { "campusId": "bj01", "campusName": "北京校区", "amount": 1200000, "ratio": 0.48 },
        { "campusId": "sh01", "campusName": "上海校区", "amount": 850000, "ratio": 0.34 },
        { "campusId": "gz01", "campusName": "广州校区", "amount": 450000, "ratio": 0.18 }
      ]
    }
  },
  "dashboard-course-type-income": {
    "code": 200,
    "message": "success",
    "data": {
      "items": [
        { "courseType": "PS", "courseTypeName": "启蒙课程", "amount": 650000, "ratio": 0.26 },
        { "courseType": "KET", "courseTypeName": "KET课程", "amount": 580000, "ratio": 0.23 },
        { "courseType": "PET", "courseTypeName": "PET课程", "amount": 720000, "ratio": 0.29 },
        { "courseType": "FCE", "courseTypeName": "FCE课程", "amount": 380000, "ratio": 0.15 },
        { "courseType": "CAE", "courseTypeName": "CAE课程", "amount": 170000, "ratio": 0.07 }
      ]
    }
  },
  "dashboard-teacher-rank": {
    "code": 200,
    "message": "success",
    "data": {
      "items": [
        { "teacherId": "T001", "teacherName": "张老师", "classCount": 8, "payCount": 156, "payAmount": 420000, "refundCount": 5, "refundAmount": 12000, "refundRateByCount": 0.032, "refundRateByAmount": 0.029 },
        { "teacherId": "T002", "teacherName": "李老师", "classCount": 6, "payCount": 132, "payAmount": 380000, "refundCount": 8, "refundAmount": 18000, "refundRateByCount": 0.061, "refundRateByAmount": 0.047 },
        { "teacherId": "T003", "teacherName": "王老师", "classCount": 7, "payCount": 145, "payAmount": 395000, "refundCount": 4, "refundAmount": 9500, "refundRateByCount": 0.028, "refundRateByAmount": 0.024 }
      ]
    }
  },
  "dashboard-class-rank": {
    "code": 200,
    "message": "success",
    "data": {
      "items": [
        { "classId": "C001", "classDisplay": "26PS003｜周三晚｜EV1", "teacherName": "张老师", "payCount": 25, "payAmount": 68000, "refundCount": 1, "refundAmount": 2500, "netAmount": 65500 },
        { "classId": "C002", "classDisplay": "26KET005｜周六上��LV2", "teacherName": "李老师", "payCount": 22, "payAmount": 72000, "refundCount": 2, "refundAmount": 5000, "netAmount": 67000 },
        { "classId": "C003", "classDisplay": "26PET002｜周日下｜LV3", "teacherName": "王老师", "payCount": 20, "payAmount": 85000, "refundCount": 0, "refundAmount": 0, "netAmount": 85000 }
      ]
    }
  }
};

// API 路由
app.get('/meta', (req, res) => res.json(db.meta));
app.get('/dashboard/summary', (req, res) => res.json(db['dashboard-summary']));
app.get('/dashboard/monthly', (req, res) => res.json(db['dashboard-monthly']));
app.get('/dashboard/class-type', (req, res) => res.json(db['dashboard-class-type']));
app.get('/dashboard/campus-income', (req, res) => res.json(db['dashboard-campus-income']));
app.get('/dashboard/course-type-income', (req, res) => res.json(db['dashboard-course-type-income']));
app.get('/dashboard/teacher-rank', (req, res) => res.json(db['dashboard-teacher-rank']));
app.get('/dashboard/class-rank', (req, res) => res.json(db['dashboard-class-rank']));

// 缴费明细
app.get('/dashboard/payment-details', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      items: [
        { id: 'P001', payDate: '2025-03-15', classId: 'C001', className: '26PS003｜周三晚｜EV1', teacherId: 'T001', teacherName: '张老师', payCount: 5, payAmount: 13600, campusName: '北京校区', courseType: 'PS' }
      ],
      total: 1,
      page: 1,
      pageSize: 10
    }
  });
});

// 退费明细
app.get('/dashboard/refund-details', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      items: [
        { id: 'R001', refundDate: '2025-03-20', classId: 'C001', className: '26PS003｜周三晚｜EV1', teacherId: 'T001', teacherName: '张老师', refundCount: 1, refundAmount: 2720, refundReason: '时间冲突', campusName: '北京校区', courseType: 'PS' }
      ],
      total: 1,
      page: 1,
      pageSize: 10
    }
  });
});

// Pivot
app.get('/dashboard/pivot', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      columns: [
        { classId: 'C001', classDisplay: '26PS003' },
        { classId: '_total', classDisplay: '合计' }
      ],
      rows: [
        { date: '2025-03-15', values: { 'C001': 13600, '_total': 13600 } }
      ],
      totals: { 'C001': 13600, '_total': 13600 }
    }
  });
});

// 登录
app.post('/auth/login', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      token: 'mock-jwt-token-12345',
      user: { id: '1', username: 'admin', role: 'admin' }
    }
  });
});

// 启动服务器
const PORT = 8080;
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('🚀 Mock Server 启动成功!');
  console.log('='.repeat(50));
  console.log(`   地址: http://localhost:${PORT}`);
  console.log('');
  console.log('   测试接口:');
  console.log(`   - http://localhost:${PORT}/meta`);
  console.log(`   - http://localhost:${PORT}/dashboard/summary`);
  console.log('='.repeat(50));
  console.log('');
});