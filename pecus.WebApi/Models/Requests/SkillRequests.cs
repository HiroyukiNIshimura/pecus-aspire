using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// �X�L���쐬���N�G�X�g
/// </summary>
public class CreateSkillRequest
{
    /// <summary>
    /// �X�L����
    /// </summary>
    [Required(ErrorMessage = "�X�L�����͕K�{�ł��B")]
    [MaxLength(100, ErrorMessage = "�X�L������100�����ȓ��œ��͂��Ă��������B")]
    public required string Name { get; set; }

    /// <summary>
    /// �X�L���̐���
    /// </summary>
    [MaxLength(500, ErrorMessage = "������500�����ȓ��œ��͂��Ă��������B")]
    public string? Description { get; set; }
}

/// <summary>
/// �X�L���X�V���N�G�X�g
/// </summary>
public class UpdateSkillRequest
{
    /// <summary>
    /// �X�L����
    /// </summary>
    [MaxLength(100, ErrorMessage = "�X�L������100�����ȓ��œ��͂��Ă��������B")]
    public string? Name { get; set; }

    /// <summary>
    /// �X�L���̐���
    /// </summary>
    [MaxLength(500, ErrorMessage = "������500�����ȓ��œ��͂��Ă��������B")]
    public string? Description { get; set; }
}

/// <summary>
/// �X�L���ꗗ�擾���N�G�X�g
/// </summary>
public class GetSkillsRequest
{
    /// <summary>
    /// �y�[�W�ԍ��i1����n�܂�j
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "�y�[�W�ԍ���1�ȏ�Ŏw�肵�Ă��������B")]
    public int? Page { get; set; }

    /// <summary>
    /// �A�N�e�B�u�ȃX�L���̂ݎ擾���邩
    /// </summary>
    public bool? IsActive { get; set; }
}
