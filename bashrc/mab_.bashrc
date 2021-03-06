#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'

#PS1='[\u@\h \W]\$ '

# Remote user prompt
#PS1="[\u\[\e[0m\]@\[\e[1;31m\]\h\[\e[0m\] \W]\$ "
PS1="[\[\e[1;37m\]\u\[\e[0m\]@\[\e[1;31m\]\h\[\e[0m\] \W]$ "

# Root prompt
#PS1="[\[\e[1;37m\]\u\[\e[0m\]@\[\e[1;31m\]\h\[\e[0m\] \W]\# "

alias grep="grep --color=auto"
alias cal="cal -3"
#alias vim="vimx"
alias opensesame="ssh-add -t 10h ~/.ssh/id_rsa"
alias mv="mv -n"

if [ -d $HOME/bin ];
    then PATH=$HOME/bin:$PATH;
fi

# Export some variables
# GTK_PATH was previously undefined. VMplayer complained about libcanberra. 
#export GTK_PATH=/usr/lib/gtk-2.0:/usr/lib/gtk-3.0
PATH=$PATH:$HOME/.local/bin

export VISUAL="vim"
# Append to history file, rather than overwrite
shopt -s histappend

# Convert multi-line commands to one line
shopt -s cmdhist

# Increase history size and history file size
HISTFILESIZE=1000000
HISTSIZE=1000000

# Ignore commands preceded by a space and duplicated commands
HISTCONTROL=ignoreboth

# Ignore these commands
HISTIGNORE='ls:bg:fg:history:exit'

PROMPT_COMMAND='history -a'

# For pretty less man colors
#man() {
#        env LESS_TERMCAP_mb=$'\E[01;31m' \
#        LESS_TERMCAP_md=$'\E[01;38;5;74m' \
#        LESS_TERMCAP_me=$'\E[0m' \
#        LESS_TERMCAP_se=$'\E[0m' \
#        LESS_TERMCAP_so=$'\E[38;5;246m' \
#        LESS_TERMCAP_ue=$'\E[0m' \
#        LESS_TERMCAP_us=$'\E[04;38;5;146m' \
#        man "$@"
#    }

xmodmap ~/.Xmodmap
