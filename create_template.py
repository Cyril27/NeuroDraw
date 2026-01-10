import matplotlib.pyplot as plt
import numpy as np


def create_spiral_template():
    padding = 70
    R = 200  # spiral max radius

    square_size = 2 * R + 2 * padding
    center = square_size / 2

    fig, ax = plt.subplots(figsize=(7, 7), dpi=100)

    # Set exact limits to square
    ax.set_xlim(0, square_size)
    ax.set_ylim(0, square_size)
    ax.set_aspect('equal')
    ax.axis('off')

    # Spiral
    theta = np.linspace(0, 6 * np.pi, 10000)
    r = np.linspace(0, R, 10000)

    x = center + r * np.cos(theta)
    y = center + r * np.sin(theta)

    ax.plot(x, y, color='red', linewidth=2)

    # Square border
    square = plt.Rectangle(
        (0, 0),
        square_size,
        square_size,
        linewidth=4,
        edgecolor='black',
        facecolor='none'
    )
    ax.add_patch(square)

    plt.show()


def create_wave_template():
    padding = 70
    width = 3000
    height = 400

    square_size = width + 2 * padding
    center_y = square_size / 2

    fig, ax = plt.subplots(figsize=(10, 7), dpi=100)

    # Set exact limits to square
    ax.set_xlim(0, square_size)
    ax.set_ylim(0, square_size)
    ax.set_aspect('equal')
    ax.axis('off')

    # Wave
    x = np.linspace(padding, square_size - padding, 1000)
    y = (center_y + 100 * np.sin(10 * np.pi * (x - padding) / width)*4
)
    ax.plot(x, y, color='red', linewidth=2)

    # Square border


    plt.show()

if __name__ == "__main__":
    create_wave_template()
