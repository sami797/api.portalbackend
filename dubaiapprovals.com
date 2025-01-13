server { 
    listen [::]:80;
    listen 80;
    server_name dubaiapprovals.com;
    return 301 https://www.dubaiapprovals.com$request_uri;            
}

server {
    listen [::]:80;
    listen 80;
    server_name www.dubaiapprovals.com;
    root /var/www/dubaiapprovals/dubaiapprovals.com;
    location / {
        proxy_pass http://127.0.0.1:5111;
        #try_files $uri $uri/ /default/index.html =404;
    }
}
