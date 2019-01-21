deploy:
	npm run build
	cp -a ../symbols.dynavox/* build/symbols
	rsync -a build/ gbserver3:/var/www/shared.tarheelreader/
