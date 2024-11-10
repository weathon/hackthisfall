import cv2
from roboflow import Roboflow
import time
import numpy as np
import os

rf = Roboflow(api_key="qOAgjoE2fn9cot859u7q")
project = rf.workspace().project("hand-pbch0")
model = project.version(1).model

cap = cv2.VideoCapture(0) 

whiteboard = 255 * np.ones(shape=[480, 640, 3], dtype=np.uint8)  # 白色画布

# 用于记录食指轨迹的列表
finger_positions = []
current_finger_positions = []  # 存储当前笔画的轨迹

# 上次处理的时间（控制帧率）
last_time = time.time()

# 目标帧率：每秒3帧
frame_rate = 5

# 临时保存图像的路径
temp_image_path = "temp_frame.jpg"

# 跟踪是否记录轨迹
is_drawing = False

# 控制是否按下空格键
space_pressed = False

while True:
    # 读取摄像头的一帧
    ret, frame = cap.read()
    if not ret:
        break
    
    # 镜像处理
    frame = cv2.flip(frame, 1)  # 1为水平镜像

    # 获取当前时间
    current_time = time.time()

    # 判断是否已经超过 1/3 秒 (即每秒3帧)
    if current_time - last_time >= 1 / frame_rate:
        # 保存当前帧为临时图像文件
        cv2.imwrite(temp_image_path, frame)
        
        # 执行模型预测
        result = model.predict(temp_image_path).json()

        # 获取预测结果中的关键点
        predictions = result.get('predictions', [])

        if predictions:
            # 清除当前画布
            current_frame = frame.copy()
            
            # 遍历每个预测结果
            for prediction in predictions:
                # 防止索引错误，先检查 'predictions' 列表是否为空
                prediction_points = prediction.get('predictions', [])
                if prediction_points:
                    keypoints = prediction_points[0].get('keypoints', [])
                    
                    # 如果有关键点
                    if keypoints:
                        for point in keypoints:
                            # 获取关键点的坐标和类别
                            x, y = int(point['x']), int(point['y'])
                            class_name = point['class_name']

                            # 打印关键点信息
                            print(f"{class_name}: ({x}, {y})")

                            # 在图像上绘制关键点（绿色圆点）
                            cv2.circle(current_frame, (x, y), 5, (0, 255, 0), -1)

                            # 如果食指被检测到，记录其位置
                            if class_name == 'new-point-0':  # 假设 'new-point-0' 是食指
                                if is_drawing:  # 只在绘制状态下记录食指位置
                                    current_finger_positions.append((x, y))

        # 如果空格键按下，开始绘制（开始一笔画）
        if cv2.waitKey(1) & 0xFF == ord(' '):  # 空格键按下
            if not space_pressed:  # 确保每次按下空格时，开始新的一笔画
                space_pressed = True
                current_finger_positions = []  # 清空当前笔画的轨迹，开始新的一笔
                is_drawing = True  # 启动绘制状态
        else:
            space_pressed = False
            is_drawing = False  # 停止绘制状态

        # 每次绘制时，记录之前的笔画，并画上轨迹
        if len(current_finger_positions) > 1:
            for i in range(1, len(current_finger_positions)):
                # 绘制连线
                cv2.line(whiteboard, current_finger_positions[i-1], current_finger_positions[i], (0, 0, 0), 3)

        # 显示实时摄像头画面和白板
        combined_frame = cv2.addWeighted(current_frame, 0.7, whiteboard, 0.3, 0)
        cv2.imshow("Real-time Hand Tracking", combined_frame)

        # 更新最后处理时间
        last_time = current_time

    # 如果按下'q'退出
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 删除临时图像文件
os.remove(temp_image_path)

# 释放摄像头和关闭窗口
cap.release()
cv2.destroyAllWindows()
