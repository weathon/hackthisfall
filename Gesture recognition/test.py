import cv2
from roboflow import Roboflow
import time
import numpy as np
import os

rf = Roboflow(api_key="qOAgjoE2fn9cot859u7q")
project = rf.workspace().project("hand-pbch0")
model = project.version(1).model

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)

# 用于记录食指轨迹的列表
current_finger_positions = []

# 上次处理的时间（控制帧率）
last_time = time.time()

frame_rate = 15  # 帧率

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
    frame = cv2.flip(frame, 1)

    # 创建与当前帧分辨率匹配的白板
    height, width, _ = frame.shape
    whiteboard = 255 * np.ones(shape=[height, width, 3], dtype=np.uint8)

    # 获取当前时间
    current_time = time.time()

    # 判断是否已经超过目标帧率时间间隔
    if current_time - last_time >= 1 / frame_rate:
        # 保存当前帧为临时图像文件
        cv2.imwrite(temp_image_path, frame)
        
        result = model.predict(temp_image_path).json()
        predictions = result.get('predictions', [])

        if predictions:
            current_frame = frame.copy()

            # 遍历每个预测结果
            for prediction in predictions:
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

                            # 在图像上绘制关键点
                            cv2.circle(current_frame, (x, y), 5, (0, 255, 0), -1)

                            # 如果食指被检测到，记录其位置
                            if class_name == 'new-point-0':
                                if is_drawing:  # 只有在绘制状态下才记录轨迹
                                    current_finger_positions.append((x, y))

        # 处理空格键的逻辑，切换绘制状态
        if cv2.waitKey(1) & 0xFF == ord(' '):
            if not space_pressed:
                space_pressed = True
                is_drawing = True  # 进入绘制状态
        else:
            space_pressed = False
            is_drawing = False  # 离开绘制状态

        # 绘制轨迹
        if len(current_finger_positions) > 1:
            for i in range(1, len(current_finger_positions)):
                cv2.line(whiteboard, current_finger_positions[i-1], current_finger_positions[i], (0, 0, 0), 3)

        # 将当前帧和白板合成显示
        combined_frame = cv2.addWeighted(current_frame, 0.7, whiteboard, 0.3, 0)
        cv2.imshow("Real-time Hand Tracking", combined_frame)

        # 更新帧率时间
        last_time = current_time

    # 按下 'q' 键退出程序
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 清理临时图像文件
if os.path.exists(temp_image_path):
    os.remove(temp_image_path)

cap.release()
cv2.destroyAllWindows()
