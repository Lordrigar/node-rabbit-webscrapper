# Simple image scraper with queue

This is a simple express app to scrape sites from images.

I've made it to better understand Queues and web scraping, so it's nothing advanced nor production ready.

FE code is pure crap, so I wouldn't even look there, it's just a simple html file with input for url and two buttons, one to scrape and other one to download files.

Server wise, it scrapes the content of provided url, extracts all images and pushes them to RabbitMQ. Rabbit then downloads them one by one and prepares download folder to be ready to...well download. That's it, nothing special.

I haven't added any checks, for valid urls, if there are any files to be downloaded or even if download finished etc, as I said: this is just for test.
