set -o nounset
set -o errexit

setopt BASH_REMATCH

export TERM=xterm-256color

screenshot () {
  echo $PWD
	regex="^([0-9]+).*$"
	last=`ls -1 screens | tail -1`
	[[ $last =~ $regex ]]
  echo $(( n = ${BASH_REMATCH[2]} ))

  for screen in ~/Desktop/Screen\ Shot\ *; do
    ((n++))
    dest=screens/$n.png

    if [[ -e $dest  ]]; then
      echo screenshot already exists: $dest
      exit 1
    fi

    echo mv $screen $dest
    mv $screen $dest
    open $dest
  done;

  open screens
  ls -l screens
}
