#!/bin/sh

userresources=$HOME/.Xresources
usermodmap=$HOME/.Xmodmap
sysresources=/etc/X11/xinit/.Xresources
sysmodmap=/etc/X11/xinit/.Xmodmap

# merge in defaults and keymaps

if [ -f $sysresources ]; then
    xrdb -merge $sysresources
fi

if [ -f $sysmodmap ]; then
    xmodmap $sysmodmap
fi

if [ -f "$userresources" ]; then
    xrdb -merge "$userresources"
fi

if [ -f "$usermodmap" ]; then
    xmodmap "$usermodmap"
fi

# start some nice programs

if [ -d /etc/X11/xinit/xinitrc.d ] ; then
 for f in /etc/X11/xinit/xinitrc.d/?*.sh ; do
  [ -x "$f" ] && . "$f"
 done
 unset f
fi

i3logDir="~/.i3/i3log"

if [[ ! -d "${i3logDir}" ]]; then
    mkdir -p ~/.i3/i3log;
fi

#twm &
#exec xterm -geometry 80x66+0+0 -name login
xset r rate 200 30
xset m 10000/1 10000/1
#exec i3 -V >> ${i3logDir}/i3log-$(date +"%F_%k:%M.%S") 2>&1
exec i3 -V 2>&1
