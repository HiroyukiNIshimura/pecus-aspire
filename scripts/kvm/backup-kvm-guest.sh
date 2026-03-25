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

# ログ出力用の基準時刻（スクリプト開始時点）
date=$(/usr/bin/date +"%Y/%m/%d %H:%M:%S")
# バックアップ処理ログの出力先
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
# スナップショット対象の LVM Volume Group 名
vg="dall-vg"
# スナップショット対象の Logical Volume 名
lv="srv"
# 作成した LVM スナップショットのマウント先
snap_dir="/var/lib/kvm/snap"
# バックアップ先 USB HDD のマウントポイント（autofs 管理）
usb_mount_dir="/mnt/backup"
# 元 LV のマウントポイント（snap_dir 内の相対パス計算に使用）
lv_mount="/srv"
# バックアップ対象の VM イメージ配置ディレクトリ
images="/srv/vm"
# 実際のバックアップ格納先ディレクトリ
backup_dir="${usb_mount_dir}/vm"
# スナップショット容量の追加余裕値（GB）
snap_extra_gb="1"
# fsfreeze 済み VM 一覧（thaw 対象管理用）
frozen_vms=""
# thaw 実行済みフラグ（trap 二重実行防止）
thaw_completed=0


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

thaw_vms (){
 if [ "${thaw_completed}" -eq 1 ]; then
  return 0
 fi

 if [ -z "${frozen_vms}" ]; then
  return 0
 fi

 thaw_completed=1
 for vm in ${frozen_vms}; do
  thaw_result=$(/usr/bin/virsh domfsthaw "${vm}" 2>&1)
  if [ $? -ne 0 ]; then
   /usr/bin/echo "${date} failed to thaw filesystem on ${vm}: ${thaw_result}" >> ${log}
  else
   /usr/bin/echo "${date} filesystem thawed on ${vm}" >> ${log}
  fi
 done
}

freeze_target_vms (){
 frozen_vms=""
 thaw_completed=0

 running_vms=$(/usr/bin/virsh list --name 2>&1)
 if [ $? -ne 0 ]; then
  /usr/bin/echo "${date} failed to list running VMs: ${running_vms}" >> ${log}
  return 1
 fi

 for vm in ${running_vms}; do
  if [ -z "${vm}" ]; then
   continue
  fi

  vm_disks=$(/usr/bin/virsh domblklist --details "${vm}" 2>/dev/null | /usr/bin/awk '$3 == "disk" {print $4}')
  for disk in ${vm_disks}; do
   case "${disk}" in
    "${images}"/*)
     freeze_result=$(/usr/bin/virsh domfsfreeze "${vm}" 2>&1)
     if [ $? -ne 0 ]; then
      /usr/bin/echo "${date} failed to freeze filesystem on ${vm}: ${freeze_result}" >> ${log}
      thaw_vms
      return 1
     fi

     frozen_vms="${frozen_vms} ${vm}"
     /usr/bin/echo "${date} filesystem frozen on ${vm}" >> ${log}
     break
     ;;
   esac
  done
 done

 return 0
}

cleanup_on_exit (){
 thaw_vms
}

trap 'cleanup_on_exit' EXIT INT TERM


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
snap_size=$(/usr/bin/echo "scale=0; ${img_size} / (4 * 1024 * 1024 * 1024) + ${snap_extra_gb}" | /usr/bin/bc)


#
# LVM スナップショットの作成
#
exists_snapshot=$(check_snapshot)

if [ "${exists_snapshot}" -eq 1 ]; then
  remove_snapshot
fi

freeze_target_vms
if [ $? -ne 0 ]; then
 /usr/bin/echo "${date} failed to freeze target VMs" >> ${log}
 exit 1
fi

lvcreate=$(/usr/sbin/lvcreate -s -L "${snap_size}GB" -n ${lv}.snap /dev/${vg}/${lv} 2>&1)
lvcreate_status=$?
thaw_vms

if [ "${lvcreate_status}" -ne 0 ]; then
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
