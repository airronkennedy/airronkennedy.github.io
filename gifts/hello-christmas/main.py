"""Hello Christmas: a tiny snowy window. Sample gift that proves the build pipeline."""
import random
import tkinter as tk

W, H = 480, 320
root = tk.Tk()
root.title("Merry Christmas!")
root.resizable(False, False)
c = tk.Canvas(root, width=W, height=H, bg="#0b1030", highlightthickness=0)
c.pack()
c.create_rectangle(0, H - 50, W, H, fill="white", outline="")
c.create_text(W / 2, H / 2 - 20, text="Merry Christmas!", fill="#ffd166", font=("Georgia", 30, "bold"))
c.create_text(W / 2, H / 2 + 22, text="from Airron", fill="#ff6b7a", font=("Georgia", 14, "italic"))
flakes = [[random.uniform(0, W), random.uniform(0, H), random.uniform(1, 3)] for _ in range(90)]
ids = [c.create_oval(0, 0, 0, 0, fill="white", outline="") for _ in flakes]

def tick():
    for f, i in zip(flakes, ids):
        f[1] += f[2] * 0.6
        f[0] += random.uniform(-0.5, 0.5)
        if f[1] > H:
            f[0], f[1] = random.uniform(0, W), -5
        c.coords(i, f[0] - f[2], f[1] - f[2], f[0] + f[2], f[1] + f[2])
    root.after(33, tick)

tick()
root.mainloop()
