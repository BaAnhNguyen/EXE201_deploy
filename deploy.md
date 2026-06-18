Bước 1 — Cài Railway CLI
npm install -g @railway/cli

Nếu vẫn báo lỗi "not recognized", thử cách này (dùng npx thay vì cài global):
npx @railway/cli login


npx @railway/cli init

npx @railway/cli up // up code từ máy lên

npx @railway/cli up --service exe201-backend( tên service) // tao service