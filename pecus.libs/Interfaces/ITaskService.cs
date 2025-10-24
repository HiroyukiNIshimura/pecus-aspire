using pecus.Libs.Models;
using System.Linq.Expressions;

namespace pecus.Libs.Interfaces
{
    public interface ITaskService
    {
        Task<TaskModel> RegisterTask(string taskName);
        Task<List<TaskModel>> Find(Expression<Func<TaskModel, bool>> filter);
        Task<long> Update(string objectId, TaskModel newOne);
    }
}
