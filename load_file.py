import io
import matplotlib.pyplot as plt
from supabase import create_client


SUPABASE_URL = "https://fzgljqihruhafuqxvduy.supabase.co/"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Z2xqcWlocnVoYWZ1cXh2ZHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzkyNjMsImV4cCI6MjA4MjUxNTI2M30.Wz0f7Ss7rosusVAumaa1e1LenvNc4d5a6DGVfYQlTm0"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)



# response = (
#     supabase.table("patients")
#     .select("*")
#     .execute()
# )

# patient_df = pd.DataFrame(response.data)
# print(f"Loaded {len(patient_df)} patients from Supabase.")
# print(patient_df.head())


bucket = "images"
path = "spiral/spiral_12.png"  # example

response = supabase.storage.from_(bucket).download(path)
data = response  # bytes

img = plt.imread(io.BytesIO(data))

plt.imshow(img)
plt.axis("off")
plt.show()

files = supabase.storage.from_("images").list("spiral")
for f in files:
    print(f["name"])
    data = supabase.storage.from_(bucket).download(f"spiral/{f['name']}")
    img = plt.imread(io.BytesIO(data))
    plt.imshow(img)
    plt.axis("off")
    plt.show()
