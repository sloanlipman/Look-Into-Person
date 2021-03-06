import os
import scipy.io
import numpy as np

img_rows, img_cols = 320, 320
channel = 3
batch_size = 16
epochs = 1000
patience = 50
num_train_samples = 28280
num_valid_samples = 5000
num_classes = 20
weight_decay = 1e-2

map = os.path.join(os.getcwd(), 'app', 'process', 'segnet', 'human_colormap.mat')

mat = scipy.io.loadmat(map)
color_map = (mat['colormap'] * 256).astype(np.int32)
