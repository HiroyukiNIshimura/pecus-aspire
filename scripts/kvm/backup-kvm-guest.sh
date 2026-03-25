#!/bin/sh
# 説明   : LVM スナップショットからディスクイメージファイルをUSB HDDにコピーする。
# 作成者 :
# 作成日 :


# 新規の構成
# root@dall:~# lvscan
#  ACTIVE            '/dev/dall-vg/root' [29.19 GiB] inherit
#  ACTIVE            '/dev/dall-vg/var' [<11.68 GiB] inherit
#  ACTIVE            '/dev/dall-vg/swap_1' [976.00 MiB] inherit
#  ACTIVE            '/dev/dall-vg/srv' [1.07 TiB] inherit

# root@dall:~# df -h
# /dev/mapper/dall--vg-srv    1.1T   53G  980G    6% /srv

# root@dall:/srv/vm# tree
# .
# ├── backup(初期イメージのバックアップ)
# │   ├── coati
# │   │   ├── coati.xml
# │   │   └── debian13.qcow2
# │   └── coati-build
# │       ├── coati-build.xml
# │       └── debian13.qcow2
# ├── coati
# │   └── debian13.qcow2
# ├── coati-build
# │   └── debian13.qcow2
# └── iso
#     └── debian-13.4.0-amd64-netinst.iso

# バックアップ先のUSBは/mnt/backupにマウントされているものとする。

date=$(/usr/bin/date +"%Y/%m/%d %H:%M:%S")
log="/var/log/backup-kvm-guest.log"
# ログローテートは logrotate で管理する。
# /etc/logrotate.d/backup-kvm-guest に以下を作成:
#   /var/log/backup-kvm-guest.log {
#       weekly
#       rotate 8
#       compress
#       missingok
#       notifempty
#   }
vg="dall-vg"
lv="srv"
snap_dir="/var/lib/kvm/snap"
usb_mount_dir="/mnt/backup"
lv_mount="/srv"
images="/srv/vm"
backup_dir="${usb_mount_dir}/vm"


remove_snapshot (){
 result=$(/usr/bin/umount "${snap_dir}" 2>&1)
 if [ $? -ne 0 ]; then
  /usr/bin/echo "${date} failed to umount ${snap_dir}: ${result}" >> ${log}
  return 1
 fi

 lvremove=$(/usr/sbin/lvremove -f /dev/${vg}/${lv}.snap 2>&1)
 if [ $? -ne 0 ]; then
  /usr/bin/echo "${date} failed to remove snapshot: ${lvremove}" >> ${log}
  return 1
 fi

 exists_snapshot=$(check_snapshot)

 if [ "${exists_snapshot}" -eq 1 ]; then
  /usr/bin/echo "${date} snapshot still exists after removal attempt" >> ${log}
  return 1
 else
  /usr/bin/echo "${date} snapshot removed successfully" >> ${log}
  return 0
 fi
}


check_snapshot (){
 lvscan=$(/usr/sbin/lvscan | /usr/bin/grep "${lv}".snap | /usr/bin/wc -c)

 if [ "${lvscan}" -gt 0 ]; then
  /usr/bin/echo 1
 else
  /usr/bin/echo 0
 fi
}

check_usb_mount (){
 if [ -d "${usb_mount_dir}" ] && /usr/bin/mountpoint -q "${usb_mount_dir}"; then
  /usr/bin/echo 1
 else
  /usr/bin/echo 0
 fi
}


#
# イメージファイルがあるか確認
#
exist_qcow2=0
if [ -d "${images}" ]; then
 # まずルート直下のファイルをチェック
 for qcow2 in "${images}"/*.qcow2 "${images}"/*.img; do
  if [ -e "${qcow2}" ]; then
   exist_qcow2=1
   break
  fi
 done

 # 見つからない場合は1段階下のサブディレクトリをチェック
 if [ "${exist_qcow2}" -eq 0 ]; then
  for qcow2 in "${images}"/*/*.qcow2 "${images}"/*/*.img; do
   if [ -e "${qcow2}" ]; then
    exist_qcow2=1
    break
   fi
  done
 fi
else
 /usr/bin/echo "${date} images directory not found: ${images}" >> ${log}
 exit 1
fi

if [ "${exist_qcow2}" -eq 0 ]; then
 /usr/bin/echo "${date} not exist image file in ${images}" >> ${log}
 # デバッグ情報を出力
 /usr/bin/echo "${date} DEBUG: contents of ${images}:" >> ${log}
 /usr/bin/ls -la "${images}" >> ${log} 2>&1
 exit 1
fi


#
# ディレクトリの確認とUSB HDD のマウント状態確認
# autofs 利用前提: パスアクセスで自動マウントをトリガー
#
/usr/bin/ls "${usb_mount_dir}" >/dev/null 2>&1

usb_mounted=$(check_usb_mount)
if [ "${usb_mounted}" -eq 0 ]; then
 /usr/bin/echo "${date} USB HDD is not mounted at ${usb_mount_dir}. Check autofs configuration." >> ${log}
 if [ ! -d "${usb_mount_dir}" ]; then
  exit 1
 fi
fi

if [ ! -e "${backup_dir}" ]; then
 /bin/mkdir -p "${backup_dir}"
 if [ $? -ne 0 ]; then
  /usr/bin/echo "${date} failed to create backup dir: ${backup_dir}" >> ${log}
  exit 1
 fi
fi


#
# ${images} のサイズの1/4 GB + 1GB をスナップショットのサイズにする。
#
if [ ! -e "${snap_dir}" ]; then
 mkdir_result=$(/bin/mkdir -p "${snap_dir}" 2>&1)
 if [ $? -ne 0 ]; then
  /usr/bin/echo "${date} failed to create snap_dir ${snap_dir}: ${mkdir_result}" >> ${log}
  /usr/bin/echo "${date} hint: run 'mkdir ${snap_dir}' as root before executing this script" >> ${log}
  exit 1
 fi
fi

img_size=$(/usr/bin/du -bs "${images}" | /usr/bin/sed -r "s/^([0-9]+).+$/\1/")
snap_size=$(/usr/bin/echo "scale=0; ${img_size} / (4 * 1024 * 1024 * 1024) + 1" | /usr/bin/bc)


#
# LVM スナップショットの作成
#
exists_snapshot=$(check_snapshot)

if [ "${exists_snapshot}" -eq 1 ]; then
  remove_snapshot
fi

lvcreate=$(/usr/sbin/lvcreate -s -L "${snap_size}GB" -n ${lv}.snap /dev/${vg}/${lv} 2>&1)
if [ $? -ne 0 ]; then
 /usr/bin/echo "${date} failed to create snapshot: ${lvcreate}" >> ${log}
 exit 1
fi
exists_snapshot=$(check_snapshot)

if [ "${exists_snapshot}" -eq 0 ]; then
 /usr/bin/echo "${date} snapshot creation failed: ${lvcreate}" >> ${log}
 exit 1
fi

# マウント実行
mount_result=$(/usr/bin/mount -o ro /dev/${vg}/${lv}.snap "${snap_dir}" 2>&1)
if [ $? -ne 0 ]; then
 /usr/bin/echo "${date} failed to mount snapshot: ${mount_result}" >> ${log}
 # マウント失敗時はスナップショットをクリーンアップして終了
 /usr/sbin/lvremove -f /dev/${vg}/${lv}.snap >> ${log} 2>&1
 exit 1
fi

# スナップショット内のイメージパス（LVマウントポイントからの相対パスを引き継ぐ）
snap_images="${snap_dir}${images#${lv_mount}}"


#
# ディスクイメージファイルのコピー
# 前回のバックアップよりも更新日時が新しい場合のみ。
#
start_date=$(/usr/bin/date +"%Y/%m/%d %H:%M:%S")
/usr/bin/echo "${start_date} start copy." >> ${log}

for qcow2 in "${snap_images}"/*.qcow2 "${snap_images}"/*.img "${snap_images}"/*/*.qcow2 "${snap_images}"/*/*.img; do
 if [ -e "${qcow2}" ]; then
  # 相対パスとディレクトリ構造を取得
  qcow2_relpath="${qcow2#${snap_images}/}"
  qcow2_dir="${qcow2_relpath%/*}"
  qcow2_name="${qcow2_relpath##*/}"

  # ディレクトリ構造がない場合（ルート直下）の処理
  if [ "${qcow2_dir}" = "${qcow2_relpath}" ]; then
    qcow2_backup_dir="${backup_dir}"
  else
    qcow2_backup_dir="${backup_dir}/${qcow2_dir}"
  fi

  # バックアップ先ディレクトリを作成
  if [ ! -d "${qcow2_backup_dir}" ]; then
    /bin/mkdir -p "${qcow2_backup_dir}"
  fi

  # ファイルの更新日時で既存ファイルをチェック
  if [ -e "${qcow2_backup_dir}/${qcow2_name}" ]; then
   active_img=$(/usr/bin/ls -l --time-style="+%s" "${qcow2}" | /usr/bin/cut -d " " -f 6)
   backup_img=$(/usr/bin/ls -l --time-style="+%s" "${qcow2_backup_dir}/${qcow2_name}" | /usr/bin/cut -d " " -f 6)

   if [ "${backup_img}" -ge "${active_img}" ]; then
    skip_date=$(/usr/bin/date +"%Y/%m/%d %H:%M:%S")
    /usr/bin/echo "${skip_date} skip ${qcow2_relpath}." >> ${log}
    continue
   fi
  fi

  copy_date=$(/usr/bin/date +"%Y/%m/%d %H:%M:%S")
  /usr/bin/echo "${copy_date} copy ${qcow2_relpath}." >> ${log}

  cp "${qcow2}" "${qcow2_backup_dir}/${qcow2_name}"
 fi
done

end_date=$(/usr/bin/date +"%Y/%m/%d %H:%M:%S")
/usr/bin/echo "${end_date} end copy." >> ${log}


#
# XML 定義ファイルのコピー
# XML ファイル名からVM名を抽出して、対応するqcow2ディレクトリに保存
#
for xml in /etc/libvirt/qemu/*.xml; do
 if [ -e "${xml}" ]; then
  xml_name="${xml##*/}"
  xml_vm="${xml_name%.xml}"

  # qcow2が存在するディレクトリを探す（find互換性向上版）
  xml_backup_dir="${backup_dir}"
  for vm_dir in "${backup_dir}"/*; do
   if [ -d "${vm_dir}" ]; then
    # そのディレクトリ内にqcow2があるか確認（find互換性対応）
    qcow2_count=0
    for qc in "${vm_dir}"/*.qcow2 "${vm_dir}"/*.img; do
     if [ -e "${qc}" ]; then
      qcow2_count=$((qcow2_count + 1))
     fi
    done

    if [ "${qcow2_count}" -gt 0 ]; then
     # ディレクトリ名がVM名（xml_vm）と一致するか確認
     dir_name="${vm_dir##*/}"
     if [ "${dir_name}" = "${xml_vm}" ]; then
      xml_backup_dir="${vm_dir}"
      break
     fi
    fi
   fi
  done

  # マッチするディレクトリがない場合はvm_subdir配下に作成
  if [ "${xml_backup_dir}" = "${backup_dir}" ]; then
    xml_backup_dir="${backup_dir}/${xml_vm}"
    if [ ! -d "${xml_backup_dir}" ]; then
      /bin/mkdir -p "${xml_backup_dir}"
    fi
  fi

  copy_date=$(/usr/bin/date +"%Y/%m/%d %H:%M:%S")
  /usr/bin/echo "${copy_date} copy xml: ${xml_name}." >> ${log}
  /bin/cp "${xml}" "${xml_backup_dir}/${xml_name}"
 fi
done


#
# LVM スナップショットの削除
# リトライロジック：最大3回まで試行
#
max_retries=3
retry_count=0
while [ ${retry_count} -lt ${max_retries} ]; do
 remove_snapshot
 if [ $? -eq 0 ]; then
  break
 fi
 retry_count=$((retry_count + 1))
 if [ ${retry_count} -lt ${max_retries} ]; then
  /usr/bin/echo "${date} retry snapshot removal (attempt $((retry_count + 1))/${max_retries})" >> ${log}
  /usr/bin/sleep 2
 fi
done

if [ ${retry_count} -ge ${max_retries} ]; then
 /usr/bin/echo "${date} WARNING: failed to remove snapshot after ${max_retries} attempts" >> ${log}
 exit 1
fi
